export type FoodItem = {
  id: string;
  name: string;
  aliases: string[];
  kcal: number;
  serving: string;
};

export const FOODS: FoodItem[] = [
  { id: "oatmeal", name: "Oatmeal", aliases: ["oats", "porridge"], kcal: 150, serving: "1 cup cooked" },
  { id: "overnight-oats", name: "Overnight oats", aliases: ["overnight"], kcal: 280, serving: "1 jar" },
  { id: "eggs", name: "Eggs", aliases: ["egg", "scrambled"], kcal: 78, serving: "1 large" },
  { id: "omelette", name: "Omelette", aliases: ["omelet"], kcal: 220, serving: "2-egg" },
  { id: "greek-yogurt", name: "Greek yogurt", aliases: ["yogurt", "yoghurt"], kcal: 100, serving: "170g" },
  { id: "protein-shake", name: "Protein shake", aliases: ["whey", "shake"], kcal: 160, serving: "1 scoop" },
  { id: "protein-bar", name: "Protein bar", aliases: ["bar"], kcal: 200, serving: "1 bar" },
  { id: "banana", name: "Banana", aliases: ["bananas"], kcal: 105, serving: "1 medium" },
  { id: "apple", name: "Apple", aliases: ["apples"], kcal: 95, serving: "1 medium" },
  { id: "berries", name: "Berries", aliases: ["blueberry", "strawberry", "raspberry"], kcal: 85, serving: "1 cup" },
  { id: "orange", name: "Orange", aliases: ["oranges"], kcal: 62, serving: "1 medium" },
  { id: "avocado", name: "Avocado", aliases: ["guacamole"], kcal: 120, serving: "half" },
  { id: "toast", name: "Toast", aliases: ["bread"], kcal: 80, serving: "1 slice" },
  { id: "bagel", name: "Bagel", aliases: ["bagels"], kcal: 280, serving: "1 bagel" },
  { id: "cereal", name: "Cereal", aliases: ["granola"], kcal: 140, serving: "1 cup" },
  { id: "pancakes", name: "Pancakes", aliases: ["pancake"], kcal: 350, serving: "2 pancakes" },
  { id: "coffee", name: "Coffee with milk", aliases: ["latte", "coffee"], kcal: 40, serving: "1 cup" },
  { id: "black-coffee", name: "Black coffee", aliases: ["americano", "espresso"], kcal: 5, serving: "1 cup" },
  { id: "green-tea", name: "Green tea", aliases: ["tea"], kcal: 2, serving: "1 cup" },
  { id: "milk", name: "Milk", aliases: ["whole milk"], kcal: 150, serving: "1 cup" },
  { id: "orange-juice", name: "Orange juice", aliases: ["oj", "juice"], kcal: 110, serving: "1 cup" },
  { id: "smoothie", name: "Smoothie", aliases: ["smoothies"], kcal: 240, serving: "1 glass" },
  { id: "chicken-breast", name: "Chicken breast", aliases: ["chicken"], kcal: 165, serving: "4 oz" },
  { id: "turkey", name: "Turkey", aliases: ["turkey breast"], kcal: 135, serving: "4 oz" },
  { id: "salmon", name: "Salmon", aliases: ["fish"], kcal: 230, serving: "4 oz" },
  { id: "tuna", name: "Tuna", aliases: ["tuna salad"], kcal: 120, serving: "1 can" },
  { id: "steak", name: "Steak", aliases: ["beef", "ribeye"], kcal: 280, serving: "4 oz" },
  { id: "shrimp", name: "Shrimp", aliases: ["prawn"], kcal: 100, serving: "4 oz" },
  { id: "tofu", name: "Tofu", aliases: ["bean curd"], kcal: 140, serving: "4 oz" },
  { id: "eggs-breakfast", name: "Eggs on toast", aliases: ["egg toast"], kcal: 240, serving: "2 eggs + toast" },
  { id: "rice", name: "White rice", aliases: ["rice"], kcal: 200, serving: "1 cup" },
  { id: "brown-rice", name: "Brown rice", aliases: ["brown rice"], kcal: 215, serving: "1 cup" },
  { id: "quinoa", name: "Quinoa", aliases: ["quinoa bowl"], kcal: 220, serving: "1 cup" },
  { id: "pasta", name: "Pasta", aliases: ["spaghetti", "noodles"], kcal: 220, serving: "1 cup" },
  { id: "potato", name: "Potato", aliases: ["potatoes"], kcal: 160, serving: "1 medium" },
  { id: "sweet-potato", name: "Sweet potato", aliases: ["yam"], kcal: 180, serving: "1 medium" },
  { id: "broccoli", name: "Broccoli", aliases: ["veg", "vegetable"], kcal: 55, serving: "1 cup" },
  { id: "salad", name: "Green salad", aliases: ["salad"], kcal: 90, serving: "1 bowl" },
  { id: "beans", name: "Beans", aliases: ["black beans", "chickpeas"], kcal: 140, serving: "1/2 cup" },
  { id: "lentil-soup", name: "Lentil soup", aliases: ["lentils", "soup"], kcal: 180, serving: "1 bowl" },
  { id: "peanut-butter", name: "Peanut butter", aliases: ["pb"], kcal: 190, serving: "2 tbsp" },
  { id: "almonds", name: "Almonds", aliases: ["nuts"], kcal: 160, serving: "1 oz" },
  { id: "cheese", name: "Cheese", aliases: ["cheddar"], kcal: 110, serving: "1 oz" },
  { id: "cottage-cheese", name: "Cottage cheese", aliases: ["cottage"], kcal: 90, serving: "1/2 cup" },
  { id: "chicken-bowl", name: "Chicken rice bowl", aliases: ["bowl", "chicken bowl"], kcal: 520, serving: "1 bowl" },
  { id: "burrito", name: "Burrito", aliases: ["burritos"], kcal: 580, serving: "1 burrito" },
  { id: "sandwich", name: "Sandwich", aliases: ["sub", "hoagie"], kcal: 350, serving: "1 sandwich" },
  { id: "wrap", name: "Wrap", aliases: ["tortilla wrap"], kcal: 420, serving: "1 wrap" },
  { id: "burger", name: "Burger", aliases: ["cheeseburger", "hamburger"], kcal: 540, serving: "1 burger" },
  { id: "fries", name: "Fries", aliases: ["french fries"], kcal: 365, serving: "medium" },
  { id: "pizza", name: "Pizza slice", aliases: ["pizza"], kcal: 285, serving: "1 slice" },
  { id: "ramen", name: "Ramen", aliases: ["noodle soup"], kcal: 380, serving: "1 bowl" },
  { id: "sushi", name: "Sushi", aliases: ["rolls", "maki"], kcal: 250, serving: "6 pieces" },
  { id: "poke", name: "Poke bowl", aliases: ["poke"], kcal: 490, serving: "1 bowl" },
  { id: "curry", name: "Curry", aliases: ["tikka", "masala"], kcal: 450, serving: "1 plate" },
  { id: "fried-rice", name: "Fried rice", aliases: ["egg fried rice"], kcal: 330, serving: "1 plate" },
  { id: "pad-thai", name: "Pad thai", aliases: ["padthai"], kcal: 530, serving: "1 plate" },
  { id: "hummus", name: "Hummus", aliases: ["houmous"], kcal: 70, serving: "2 tbsp" },
  { id: "muffin", name: "Muffin", aliases: ["muffins"], kcal: 420, serving: "1 muffin" },
  { id: "croissant", name: "Croissant", aliases: ["pastry"], kcal: 270, serving: "1 croissant" },
  { id: "ice-cream", name: "Ice cream", aliases: ["icecream"], kcal: 210, serving: "1 scoop" },
  { id: "chocolate", name: "Chocolate", aliases: ["dark chocolate"], kcal: 150, serving: "1 oz" },
  { id: "cookie", name: "Cookie", aliases: ["cookies"], kcal: 80, serving: "1 cookie" },
  { id: "soda", name: "Soda", aliases: ["cola", "coke"], kcal: 140, serving: "12 oz" },
  { id: "beer", name: "Beer", aliases: ["lager"], kcal: 150, serving: "12 oz" },
  { id: "wine", name: "Wine", aliases: ["red wine"], kcal: 125, serving: "5 oz" },
  { id: "water", name: "Water", aliases: ["sparkling water"], kcal: 0, serving: "1 glass" },
];

export type MealEstimate = {
  name: string;
  kcal: number;
  servings: number;
  foodId?: string;
  serving: string;
  matched: boolean;
};

function parseQuery(raw: string): { servings: number; rest: string; trailingKcal?: number } {
  const q = raw.trim().toLowerCase();
  const trailing = q.match(/\s+(\d{2,4})\s*(kcal|cals?|calories)?$/i);
  let rest = q;
  let trailingKcal: number | undefined;
  if (trailing) {
    trailingKcal = Number(trailing[1]);
    rest = q.slice(0, trailing.index).trim();
  }
  const lead = rest.match(/^(\d+(?:\.\d+)?)\s*(x|×)?\s+(.+)/);
  if (lead) {
    return { servings: Number(lead[1]), rest: lead[3] ?? rest, trailingKcal };
  }
  return { servings: 1, rest, trailingKcal };
}

export function searchFoods(query: string, limit = 6): FoodItem[] {
  const { rest } = parseQuery(query);
  if (rest.length < 1) return FOODS.slice(0, limit);
  const scored = FOODS.map((food) => {
    const hay = [food.name, ...food.aliases].map((s) => s.toLowerCase());
    let score = 0;
    for (const h of hay) {
      if (h === rest) score = Math.max(score, 100);
      else if (h.startsWith(rest)) score = Math.max(score, 80);
      else if (rest.startsWith(h) && h.length >= 3) score = Math.max(score, 70);
      else if (h.includes(rest) || rest.includes(h)) score = Math.max(score, 50);
    }
    return { food, score };
  })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((row) => row.food);
}

export function estimateMeal(query: string): MealEstimate {
  if (!query.trim()) {
    return { name: "", kcal: 0, servings: 1, serving: "custom", matched: false };
  }
  const parsed = parseQuery(query);
  const matches = searchFoods(query, 1);
  const food = matches[0];
  if (food) {
    const kcal = Math.round(food.kcal * parsed.servings);
    return {
      name: food.name,
      kcal: parsed.trailingKcal ?? kcal,
      servings: parsed.servings,
      foodId: food.id,
      serving: food.serving,
      matched: true,
    };
  }
  const fallbackName = query.trim() || "Meal";
  return {
    name: fallbackName.replace(/\s+\d{2,4}\s*(kcal|cals?)?$/i, "").trim() || fallbackName,
    kcal: parsed.trailingKcal ?? 0,
    servings: parsed.servings,
    serving: "custom",
    matched: false,
  };
}

export const QUICK_FOODS = [
  "oatmeal",
  "eggs",
  "banana",
  "protein-shake",
  "chicken-bowl",
  "salad",
  "greek-yogurt",
  "rice",
] as const;

export function foodById(id: string): FoodItem | undefined {
  return FOODS.find((food) => food.id === id);
}
