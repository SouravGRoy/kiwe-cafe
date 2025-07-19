import { Utensils, Coffee, Pizza, Sandwich, Salad, IceCream, Soup, ChefHat, Egg } from "lucide-react"

export const categories = [
  {
    id: "breakfast",
    name: "Breakfast",
    icon: Egg,
    color: "bg-orange-100 text-orange-600 border-orange-200",
  },
  {
    id: "soups",
    name: "Soups",
    icon: Soup,
    color: "bg-blue-100 text-blue-600 border-blue-200",
  },
  {
    id: "salad",
    name: "Salad",
    icon: Salad,
    color: "bg-green-100 text-green-600 border-green-200",
  },
  {
    id: "starters",
    name: "Starters",
    icon: ChefHat,
    color: "bg-purple-100 text-purple-600 border-purple-200",
  },
  {
    id: "burgers",
    name: "Burgers",
    icon: Sandwich,
    color: "bg-yellow-100 text-yellow-600 border-yellow-200",
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    icon: Sandwich,
    color: "bg-indigo-100 text-indigo-600 border-indigo-200",
  },
  {
    id: "main-course",
    name: "Main Course",
    icon: Utensils,
    color: "bg-red-100 text-red-600 border-red-200",
  },
  {
    id: "pizza",
    name: "Pizza",
    icon: Pizza,
    color: "bg-orange-100 text-orange-600 border-orange-200",
  },
  {
    id: "pasta",
    name: "Pasta",
    icon: Utensils,
    color: "bg-pink-100 text-pink-600 border-pink-200",
  },
  {
    id: "dessert",
    name: "Dessert",
    icon: IceCream,
    color: "bg-pink-100 text-pink-600 border-pink-200",
  },
  {
    id: "beverages",
    name: "Beverages",
    icon: Coffee,
    color: "bg-brown-100 text-brown-600 border-brown-200",
  },
]

export const foodTypeFilters = [
  { id: "all", name: "All", color: "bg-gray-100 text-gray-600" },
  { id: "veg", name: "Veg", color: "bg-green-100 text-green-600" },
  { id: "non-veg", name: "Non-Veg", color: "bg-red-100 text-red-600" },
  { id: "egg", name: "Egg", color: "bg-yellow-100 text-yellow-600" },
]
