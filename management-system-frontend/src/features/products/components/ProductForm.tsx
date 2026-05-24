import React, { useState, useEffect } from 'react'
import { useProducts } from '../api/useProducts'
import { useCategories } from '../api/useCategories'
import { Package, Tag, Wallet, FileText, Plus, PlusCircle, X, ChevronDown, Check, ImagePlus, Pencil, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@shared/ui/molecules/ConfirmModal'
import { useClickOutside } from '@backend/lib/hooks'
import { formatNumber } from '@shared/utils/formatters'
import { useNotification } from '@shared/ui/molecules/Notification'
import { supabase, isCloudMode, generateUUID, type Product } from '@backend/lib/db'
import { sanitizeInput } from '@shared/utils/commonUtils'
import { QuantityStepper } from '@shared/ui/atoms/QuantityStepper'
import { compressImage } from '@shared/utils/imageCompressor'


interface ProductFormProps {
  onSuccess: () => void
  initialData?: Product
  onDirtyChange?: (isDirty: boolean) => void
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSuccess, initialData, onDirtyChange }) => {
  const { notify } = useNotification()
  const { addProduct, updateProduct } = useProducts()
  const { categories, addCategory } = useCategories()
  
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showConfirm, setShowConfirm] = useState(false)
  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false))

  const { updateCategory, deleteCategory } = useCategories()

  const [imageFiles, setImageFiles] = useState<Record<string, { file: File; base64: string }>>({})
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    price: initialData ? formatNumber(initialData.price || 0) : '0.00',
    category: initialData?.category || '',
    description: initialData?.description || '',
    image: initialData?.image || '',
    images: initialData?.images || (initialData?.image ? [initialData.image] : [])
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const remainingSlots = 4 - formData.images.length
    const filesToProcess = files.slice(0, remainingSlots)

    filesToProcess.forEach(async (file) => {
      try {
        // Compress the image file on client side first (800px max-width, 0.8 quality factor)
        const compressedFile = await compressImage(file, 800, 0.8)
        
        // Instant zero-latency image preview using Web Object URL of the compressed file
        const previewUrl = URL.createObjectURL(compressedFile)
        
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, previewUrl].slice(0, 4) 
        }))

        // Load Base64 fallback asynchronously in background (prevents UI lock)
        const reader = new FileReader()
        reader.onloadend = () => {
          setImageFiles(prev => ({
            ...prev,
            [previewUrl]: { file: compressedFile, base64: reader.result as string }
          }))
        }
        reader.readAsDataURL(compressedFile)
      } catch (err) {
        console.error('Image compression failed, using original:', err)
        const previewUrl = URL.createObjectURL(file)
        
        setFormData(prev => ({ 
          ...prev, 
          images: [...prev.images, previewUrl].slice(0, 4) 
        }))

        const reader = new FileReader()
        reader.onloadend = () => {
          setImageFiles(prev => ({
            ...prev,
            [previewUrl]: { file, base64: reader.result as string }
          }))
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleRemoveImage = (indexToRemove: number) => {
    const targetUrl = formData.images[indexToRemove]
    if (targetUrl.startsWith('blob:')) {
      URL.revokeObjectURL(targetUrl) // Clean up memory immediately
    }
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }))
  }

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    if (indexToPrimary === 0) return
    setFormData(prev => {
      const newImages = [...prev.images]
      const [selected] = newImages.splice(indexToPrimary, 1)
      newImages.unshift(selected)
      return { ...prev, images: newImages }
    })
  }

  // Close dropdown on click away
  useEffect(() => {

  }, [])

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Please enter a valid price'
    if (!formData.category) newErrors.category = 'Please select a category'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddNewCategory = async () => {
    const sanitizedName = sanitizeInput(newCategoryName)
    if (!sanitizedName) return
    try {
      await addCategory({ name: sanitizedName, createdAt: new Date() })
      setFormData({ ...formData, category: sanitizedName })
      if (errors.category) setErrors(prev => ({ ...prev, category: '' }))
      setNewCategoryName('')
      setIsAddingNewCategory(false)
      setIsDropdownOpen(false)
      notify({
        type: 'add',
        title: 'Category Added',
        message: `Category "${sanitizedName}" successfully added!`
      })
    } catch (e: any) {
      notify({
        type: 'error',
        message: e?.message || `Failed to add category "${sanitizedName}".`
      })
    }
  }

  const handleUpdateCategory = async (id: string) => {
    const sanitizedName = sanitizeInput(newCategoryName)
    if (!sanitizedName) return
    try {
      await updateCategory({ id, changes: { name: sanitizedName } })
      
      // If the currently selected category was renamed, update the form state
      const oldCat = categories.find(c => c.id === id)
      if (oldCat && formData.category === oldCat.name) {
        setFormData(prev => ({ ...prev, category: sanitizedName }))
      }
      
      setEditingCategoryId(null)
      setIsAddingNewCategory(false)
      setNewCategoryName('')
      notify({
        type: 'update',
        title: 'Category Updated',
        message: `Category renamed to "${sanitizedName}" successfully!`
      })
    } catch (e: any) {
      notify({
        type: 'error',
        message: e?.message || `Failed to update category.`
      })
    }
  }

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return
    const id = categoryToDelete
    const catToDelete = categories.find(c => c.id === id)
    try {
      await deleteCategory(id)
      
      // If the deleted category was selected, reset to default
      if (catToDelete && formData.category === catToDelete.name) {
        setFormData(prev => ({ ...prev, category: categories.find(c => c.id !== id)?.name || '' }))
      }
      
      setCategoryToDelete(null)
      setEditingCategoryId(null)
      setIsAddingNewCategory(false)
      setNewCategoryName('')
      notify({
        type: 'delete',
        title: 'Category Removed',
        message: `Category "${catToDelete?.name || ''}" successfully deleted!`
      })
    } catch (e: any) {
      notify({
        type: 'error',
        message: e?.message || `Failed to delete category.`
      })
    }
  }

  const handleSave = async () => {
    setShowConfirm(false)
    if (!validate()) return
    setIsUploading(true)

    try {
      const cloud = isCloudMode()
      const finalImages: string[] = []

      for (const img of formData.images) {
        if (img.startsWith('blob:')) {
          const tracked = imageFiles[img]
          if (tracked) {
            if (cloud) {
              // Upload binary file directly to Supabase storage bucket
              const fileExt = tracked.file.name.split('.').pop()
              const fileName = `${generateUUID()}.${fileExt}`
              const filePath = `products/${fileName}`

              const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, tracked.file, {
                  cacheControl: '3600',
                  upsert: false
                })
              
              if (uploadError) throw uploadError

              const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath)
              
              finalImages.push(publicUrl)
            } else {
              // Local mode fallback: use pre-generated Base64
              finalImages.push(tracked.base64)
            }
            // Revoke the blob URL to free up browser memory
            URL.revokeObjectURL(img)
          }
        } else {
          // Already an online CDN URL or existing base64 string
          finalImages.push(img)
        }
      }

      // First image in array is the primary thumbnail
      const primaryImage = finalImages[0] || ''

      const sanitizedData = {
        name: sanitizeInput(formData.name),
        category: sanitizeInput(formData.category),
        description: sanitizeInput(formData.description),
        price: parseFloat(formData.price),
        image: primaryImage,
        images: finalImages
      }

      if (initialData?.id) {
        await updateProduct({
          id: initialData.id,
          changes: sanitizedData
        })
        notify({
          type: 'update',
          title: 'Bite Updated',
          message: `Bite ${sanitizedData.name} successfully updated!`
        })
      } else {
        await addProduct({
          ...sanitizedData,
          createdAt: new Date()
        })
        notify({
          type: 'add',
          title: 'Bite Added',
          message: `Bite ${sanitizedData.name} successfully added!`
        })
      }
      onSuccess()
    } catch (err: any) {
      notify({
        type: 'error',
        message: err?.message || `Failed to save bite ${formData.name}.`
      })
    } finally {
      setIsUploading(false)
    }
  }

  const hasChanges = React.useMemo(() => {
    if (!initialData) return true
    
    const initialPrice = initialData ? formatNumber(initialData.price || 0) : '0.00'
    const initialImages = initialData?.images || (initialData?.image ? [initialData.image] : [])
    
    const isImagesEqual = formData.images.length === initialImages.length &&
      formData.images.every((img, idx) => img === initialImages[idx])

    return (
      formData.name.trim() !== (initialData.name || '').trim() ||
      formData.price !== initialPrice ||
      formData.category !== (initialData.category || '') ||
      formData.description.trim() !== (initialData.description || '').trim() ||
      !isImagesEqual
    )
  }, [initialData, formData])

  const isDirty = React.useMemo(() => {
    if (initialData) {
      return hasChanges
    }
    return (
      formData.name.trim() !== '' ||
      formData.price !== '0.00' ||
      formData.category !== '' ||
      formData.description.trim() !== '' ||
      formData.images.length > 0
    )
  }, [initialData, hasChanges, formData])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setShowConfirm(true)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><ImagePlus size={14} /> Product Images (Up to 4)</span>
          <span className="text-[10px]">{formData.images.length}/4</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {formData.images.map((img, idx) => (
            <div key={idx} className="relative w-full h-24 bg-brand-cream/10 rounded-md overflow-hidden group">
              <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
              
              {/* Primary badge for index 0 */}
              {idx === 0 && (
                <div className="absolute top-1 left-1 bg-brand-dough text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                  COVER
                </div>
              )}

              {/* Set Primary Button (only if not index 0) */}
              {idx !== 0 && (
                <button
                  type="button"
                  onClick={() => handleSetPrimaryImage(idx)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white text-brand-dough rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                  title="Set as cover image"
                >
                  <Check size={16} strokeWidth={3} />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleRemoveImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-white text-red-500 rounded-md flex items-center justify-center shadow-sm active:scale-90"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {formData.images.length < 4 && (
            <div className="relative w-full h-24 bg-brand-cream/10 border-2 border-dashed border-brand-chocolate/20 rounded-md flex flex-col items-center justify-center text-brand-chocolate/40 hover:bg-brand-dough/10 transition-colors">
              <ImagePlus size={20} className="mb-1" />
              <span className="text-[10px] font-bold tracking-wider">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <Package size={14} /> Product Name
        </label>
        <input
          type="text"
          placeholder="e.g. Red Velvet Donut"
          className={`w-full p-4 bg-brand-cream/10 border ${errors.name ? 'border-red-500 bg-red-50/10' : 'border-brand-chocolate/10'} rounded-md focus:outline-none focus:ring-1 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-brand-dough'}`}
          value={formData.name}
          onChange={(e) => {
            setFormData({ ...formData, name: e.target.value })
            if (errors.name) setErrors({ ...errors, name: '' })
          }}
        />
        {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price Stepper */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
            <Wallet size={14} /> Price (GH₵)
          </label>
          <QuantityStepper
            value={parseFloat(formData.price) || 0}
            onChange={(price) => {
              setFormData({ ...formData, price: formatNumber(price) })
              if (errors.price && price > 0) setErrors(prev => ({ ...prev, price: '' }))
            }}
            min={0}
            step={1}
            isDecimal={true}
            placeholder="0.00"
            className={`w-full h-14 bg-brand-cream/10 font-bold ${errors.price ? 'border-red-500 text-red-500' : 'text-brand-chocolate'}`}
          />
          {errors.price && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.price}</p>}
        </div>

        <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
          <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2 justify-between">
            <span className="flex items-center gap-2"><Tag size={14} /> Category</span>
            {!isAddingNewCategory && (
              <button 
                type="button"
                onClick={() => setIsAddingNewCategory(true)}
                className="text-brand-chocolate hover:opacity-60 transition-opacity"
              >
                <PlusCircle size={14} />
              </button>
            )}
          </label>
          
          {isAddingNewCategory ? (
            <div className="flex items-center bg-brand-cream/10 border border-brand-chocolate/20 rounded-md p-1 h-14 animate-in slide-in-from-right-2 overflow-hidden">
              <input
                type="text"
                placeholder={editingCategoryId ? "Rename..." : "Name..."}
                className="min-w-0 flex-1 bg-transparent px-2 text-xs font-bold focus:outline-none text-brand-chocolate"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    editingCategoryId ? handleUpdateCategory(editingCategoryId) : handleAddNewCategory()
                  }
                }}
              />
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  disabled={!newCategoryName.trim()}
                  onClick={() => {
                    if (newCategoryName.trim()) {
                      editingCategoryId ? handleUpdateCategory(editingCategoryId) : handleAddNewCategory()
                    }
                  }}
                  className={`w-7 h-10 rounded flex items-center justify-center transition-all ${
                    !newCategoryName.trim()
                      ? 'bg-brand-chocolate/20 text-brand-chocolate/40 cursor-not-allowed shadow-none'
                      : 'bg-brand-chocolate text-white shadow-md active:scale-90 transition-transform'
                  }`}
                >
                  {editingCategoryId ? <Check size={14} /> : <Plus size={14} />}
                </button>
                {editingCategoryId ? (
                  <div className="flex flex-col gap-0.5 h-10 w-7">
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(editingCategoryId)}
                      className="flex-1 bg-red-50 text-red-400 rounded-t-sm flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewCategory(false)
                        setEditingCategoryId(null)
                        setNewCategoryName('')
                      }}
                      className="flex-1 bg-brand-chocolate/5 text-brand-chocolate rounded-b-sm flex items-center justify-center active:bg-brand-chocolate/10"
                      title="Cancel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(false)}
                    className="w-7 h-10 bg-brand-chocolate/5 text-brand-chocolate rounded flex items-center justify-center active:bg-brand-chocolate/10"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (categories.length === 0) {
                  setIsAddingNewCategory(true)
                } else {
                  setIsDropdownOpen(!isDropdownOpen)
                }
              }}
              className="w-full px-4 h-14 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-brand-dough"
            >
              <span className={`text-xs font-bold ${formData.category ? 'text-brand-chocolate' : 'text-brand-chocolate/40'}`}>
                {formData.category || (categories.length === 0 ? 'Add first category' : 'Select Category')}
              </span>
              {categories.length === 0 ? (
                <Plus size={14} className="text-brand-chocolate/40" />
              ) : (
                <ChevronDown size={14} className={`text-brand-chocolate/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
          )}
          {errors.category && <p className="text-[10px] text-red-500 font-bold mt-1">{errors.category}</p>}
          
          {/* Custom Dropdown Menu */}
          {isDropdownOpen && !isAddingNewCategory && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-brand-surface border border-brand-chocolate/10 rounded-md shadow-2xl z-[60] overflow-y-auto max-h-[140px] animate-in fade-in zoom-in-95 duration-100 no-scrollbar">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center border-b border-brand-chocolate/5 last:border-0 hover:bg-brand-dough/10 transition-colors">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, category: cat.name })
                      setIsDropdownOpen(false)
                      if (errors.category) setErrors(prev => ({ ...prev, category: '' }))
                    }}
                    className={`flex-1 text-left px-4 py-3 text-xs font-bold flex items-center justify-between ${formData.category === cat.name ? 'text-brand-chocolate bg-brand-dough/5' : 'text-brand-chocolate/60'}`}
                  >
                    {cat.name}
                    {formData.category === cat.name && <Check size={14} className="text-brand-chocolate" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsAddingNewCategory(true)
                      setEditingCategoryId(cat.id!)
                      setNewCategoryName(cat.name)
                      setIsDropdownOpen(false)
                    }}
                    className="p-3 text-brand-chocolate/20 hover:text-brand-chocolate transition-colors"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold tracking-tight text-brand-chocolate/40 flex items-center gap-2">
          <FileText size={14} /> Description (Optional)
        </label>
        <textarea
          placeholder="Describe your bite..."
          className="w-full p-4 h-24 bg-brand-cream/10 border border-brand-chocolate/10 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-dough resize-none"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <div className="sticky bottom-0 bg-transparent pt-2 pb-3 z-10">
        <button 
          type="submit" 
          disabled={isUploading || (!!initialData && !hasChanges)}
          className="btn-primary w-full h-14 text-lg shadow-xl rounded-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <span className="w-5 h-5 border-2 border-brand-cream border-t-transparent rounded-full animate-spin" />
              <span>Saving product...</span>
            </>
          ) : (
            initialData ? 'Save Changes' : 'Save Product'
          )}
        </button>
      </div>

      <ConfirmModal 
        isOpen={!!categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Category?"
        message="This will permanently remove this category. Products in this category will remain but their category name might need updating."
      />

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title={initialData ? 'Save Changes?' : 'Save Product?'}
        message={initialData
          ? `Update "${formData.name}" with the new details?`
          : `Save "${formData.name}" as a new product?`
        }
        confirmText={initialData ? 'Yes, Save' : 'Yes, Add'}
        isDestructive={false}
        watermarkType="update"
      />
    </form>
  )
}
