import { type Recipe } from '@backend/lib/db'

const recipeNames = [
  'Grandma’s Red Velvet', 'Traditional Meat Pie', 'Ultimate Chocolate Fudge', 'Classic Butter Croissants',
  'Signature Sugar Cookies', 'Rustic Whole Wheat', 'Spiced Sausage Rolls', 'Fluffy Vanilla Cupcakes',
  'Nutty Carrot Cake', 'Chewy Oatmeal Raisin', 'Rich Brioche', 'Sweet Apple Turnovers',
  'Creamy Chicken Pie', 'Zesty Lemon Drizzle', 'Double Choco Chip Cookies', 'Garlic Herb Bread',
  'Cheddar Cheese Straws', 'Fresh Strawberry Tart', 'Old Fashioned Pound Cake', 'Moist Banana Bread',
  'Zesty Blueberry Muffins', 'Gooey Cinnamon Rolls', 'Tangy Sourdough', 'Vibrant Rainbow Cake',
  'Crunchy Peanut Butter Cookies', 'Mini Beef Wellington', 'Classic Quiche Lorraine', 'Forest Berry Cake',
  'Apricot Danish', 'Herby Focaccia', 'Buttery Shortbread', 'Crusty Baguette',
  'Spinach & Cheese Roll', 'Red Berry Tart', 'Victoria Sponge', 'Festive Challah',
  'Assorted Macarons', 'New York Cheesecake', 'Spiced Gingerbread', 'Healthy Multigrain',
  'Chocolate Eclairs', 'Creamy Profiteroles', 'Sesame Bagels', 'Classic Tiramisu',
  'Soft Snickerdoodles', 'Flaky Fish Pie', 'Savory Ham Croissant', 'Marble Swirl Cake',
  'Pain au Chocolat', 'Italian Ciabatta'
]

const ingredientBases = [
  '2.5 cups Flour\n1.5 cups Sugar\n100g Butter\n2 large Eggs',
  '500g Flour\n10g Yeast\n300ml Water\n1 tsp Salt',
  '1 cup Cocoa\n2 cups Milk\n1.5 cups Sugar\n2 cups Flour',
  '500g Beef\n250g Pastry\n2 Onions\nSpices to taste',
  '500g Chicken\n200ml Cream\n1 Shortcrust\nMixed Veggies'
]

const methodBases = [
  'Preheat and mix ingredients.\nBake until golden brown.\nCool on a wire rack.',
  'Knead the dough for 10 minutes.\nLet it rise in a warm place.\nBake at 200C.',
  'Whisk eggs and sugar until fluffy.\nFold in dry ingredients.\nSteam for 45 minutes.',
  'Sauté the filling until tender.\nWrap in pastry and seal.\nBake at 180C.'
]

const noteBases = [
  'A classic family favorite.',
  'Secret recipe from my travels.',
  'Always a hit at parties.',
  'Best served warm with coffee.',
  'Requires high-quality butter.'
]

const years = [2024, 2025, 2026]

export const mockRecipes: Recipe[] = recipeNames.map((name, i) => {
  const year = years[i % 3]
  const month = Math.floor(Math.random() * 12)
  const day = Math.floor(Math.random() * 28) + 1
  
  return {
    title: name,
    ingredients: `${ingredientBases[i % ingredientBases.length]}\nSecret ingredient #${i + 100}`,
    method: `${methodBases[i % methodBases.length]}\nVariation: ${i % 2 === 0 ? 'Add more spice' : 'Reduce sugar'}.`,
    notes: `${noteBases[i % noteBases.length]} This is version ${i + 1}.`,
    createdAt: new Date(year, month, day)
  }
})
