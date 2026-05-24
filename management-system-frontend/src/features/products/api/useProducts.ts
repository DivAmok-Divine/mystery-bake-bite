import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { db, supabase, isCloudMode, generateUUID, type Product } from '@backend/lib/db'

export const useProducts = () => {
  const queryClient = useQueryClient()
  const cloud = isCloudMode()

  const productsQuery = useQuery({
    queryKey: ['products', cloud ? 'cloud' : 'local'],
    queryFn: async () => {
      if (cloud) {
        const { data, error } = await supabase.from('products').select('*')
        if (error) throw error
        return (data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          description: p.description,
          image: p.image,
          images: p.images,
          createdAt: new Date(p.created_at)
        })).sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      } else {
        const data = await db.products.toArray()
        return data.sort((a, b) => {
          const timeA = new Date((a as any).updatedAt || a.createdAt).getTime()
          const timeB = new Date((b as any).updatedAt || b.createdAt).getTime()
          return timeB - timeA
        })
      }
    },
  })

  const addProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (cloud) {
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            image: product.image,
            images: product.images,
            updated_at: new Date().toISOString()
          }])
          .select()
        if (error) throw error
        return data[0]
      } else {
        const id = generateUUID()
        await db.products.add({ ...product, id, createdAt: new Date(), updatedAt: new Date() } as any)
        return { ...product, id }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string, changes: Partial<Product> }) => {
      if (cloud) {
        const dbChanges: any = {}
        if (changes.name !== undefined) dbChanges.name = changes.name
        if (changes.price !== undefined) dbChanges.price = changes.price
        if (changes.category !== undefined) dbChanges.category = changes.category
        if (changes.description !== undefined) dbChanges.description = changes.description
        if (changes.image !== undefined) dbChanges.image = changes.image
        if (changes.images !== undefined) dbChanges.images = changes.images
        dbChanges.updated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('products')
          .update(dbChanges)
          .eq('id', id)
          .select()
        if (error) throw error
        return data[0]
      } else {
        await db.products.update(id, { ...changes, updatedAt: new Date() } as any)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      if (cloud) {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id)
        if (error) throw error
      } else {
        await db.products.delete(id)
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })

  return {
    products: productsQuery.data || [],
    isLoading: productsQuery.isLoading,
    addProduct: addProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    deleteProduct: deleteProductMutation.mutateAsync,
  }
}
