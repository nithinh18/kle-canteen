// KLE Canteen - Menu Database & Configuration
const MENU_ITEMS = [
  // --- BREAKFAST ---
  {
    id: "b1",
    name: "Mysore Masala Dosa",
    category: "breakfast",
    price: 65,
    rating: 4.9,
    reviewsCount: 384,
    prepTime: "6 mins",
    calories: "340 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Student Favorite",
    description: "Golden crispy crepe smeared with fiery red garlic-chilli chutney, spiced potato mash filling, served with fresh coconut chutney & piping hot sambhar.",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Pure Ghee", price: 15 },
      { name: "Extra Amul Cheese", price: 20 },
      { name: "Extra Sambhar Bowl", price: 0 }
    ]
  },
  {
    id: "b2",
    name: "Thatte Idli & Crispy Medu Vada Combo",
    category: "breakfast",
    price: 55,
    rating: 4.8,
    reviewsCount: 290,
    prepTime: "4 mins",
    calories: "280 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Bestseller",
    description: "Fluffy plate-sized steamed Thatte Idli paired with a crunchy, golden medu vada dipped in aromatic drumstick sambhar & mint coconut chutney.",
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Podi & Ghee Drizzle", price: 15 },
      { name: "Extra Vada", price: 25 }
    ]
  },
  {
    id: "b3",
    name: "College Puri Bhaji (3 pcs)",
    category: "breakfast",
    price: 60,
    rating: 4.7,
    reviewsCount: 215,
    prepTime: "7 mins",
    calories: "410 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Morning Rush",
    description: "Puffed golden wheat puris served with tempered potato-onion bhaji, tangy pickle, and spiced sliced green chillies.",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra 2 Puris", price: 25 },
      { name: "Extra Bhaji Bowl", price: 20 }
    ]
  },
  {
    id: "b4",
    name: "Classic Bun Maska & Irani Chai",
    category: "breakfast",
    price: 45,
    rating: 4.9,
    reviewsCount: 420,
    prepTime: "3 mins",
    calories: "260 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Campus Heritage",
    description: "Ultra-soft bakery bun loaded with whipped Amul salted butter and sweet tutti-frutti, paired with a cutting hot spiced Irani tea.",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "With Mixed Fruit Jam", price: 10 },
      { name: "Double Butter", price: 15 }
    ]
  },
  {
    id: "b5",
    name: "Kanda Poha with Sev & Lemon",
    category: "breakfast",
    price: 40,
    rating: 4.6,
    reviewsCount: 160,
    prepTime: "3 mins",
    calories: "220 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Light & Healthy",
    description: "Flattened rice tempered with mustard seeds, curry leaves, crunchy peanuts, and green chillies, topped with Ratlami sev and fresh coriander.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Sev & Peanuts", price: 10 }
    ]
  },

  // --- MEALS & THALIS ---
  {
    id: "m1",
    name: "KLE Royal South Indian Thali",
    category: "meals",
    price: 95,
    rating: 4.9,
    reviewsCount: 650,
    prepTime: "5 mins",
    calories: "620 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Chef's Special",
    description: "Unlimited Sona Masoori steamed rice, Karnataka style Sambar, Pepper Rasam, 2 Seasonal Dry Sabzis, Curd, Papad, Pickle & sweet Semiya Payasam.",
    image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Add 2 Hot Chapatis", price: 20 },
      { name: "Extra Cup Curd", price: 15 },
      { name: "Add Roasted Papad", price: 10 }
    ]
  },
  {
    id: "m2",
    name: "Special Veg Dum Biryani with Raita",
    category: "meals",
    price: 110,
    rating: 4.8,
    reviewsCount: 512,
    prepTime: "8 mins",
    calories: "550 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Top Rated",
    description: "Fragrant long-grain aged Basmati rice slow-cooked in handi with marinated paneer cubes, fresh veggies, saffron milk, served with boondi raita & salan.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Paneer Cubes", price: 30 },
      { name: "Extra Spicy Salan", price: 10 },
      { name: "Add Boondi Raita", price: 15 }
    ]
  },
  {
    id: "m3",
    name: "Paneer Butter Masala with 3 Butter Rotis",
    category: "meals",
    price: 125,
    rating: 4.9,
    reviewsCount: 430,
    prepTime: "9 mins",
    calories: "590 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Student Saver",
    description: "Soft malai paneer simmered in rich creamy tomato cashew gravy, finished with kasuri methi & butter, served with 3 fluffy tawa butter rotis & onion salad.",
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Swap Rotis for Jeera Rice", price: 15 },
      { name: "Extra Butter Roti (1 pc)", price: 12 },
      { name: "Extra Gravy", price: 35 }
    ]
  },
  {
    id: "m4",
    name: "Punjabi Chole Bhature (2 Giant Bhaturas)",
    category: "meals",
    price: 90,
    rating: 4.8,
    reviewsCount: 395,
    prepTime: "8 mins",
    calories: "680 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Weekend Special",
    description: "Spiced Amritsari dark chickpea curry loaded with authentic spices, paired with 2 giant balloon-puffed bhaturas, pickled amla, and sirka onions.",
    image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Bhatura (1 pc)", price: 30 },
      { name: "Extra Chole Portion", price: 35 }
    ]
  },
  {
    id: "m5",
    name: "Royal Kaju Paneer Dum Biryani Feast",
    category: "meals",
    price: 130,
    rating: 4.9,
    reviewsCount: 680,
    prepTime: "7 mins",
    calories: "580 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Chef's Handi Feast",
    description: "Fragrant saffron basmati rice layered with golden roasted cashews, marinated malai paneer cubes, caramelized onions, served with chilled boondi raita & spiced mirchi ka salan.",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Roasted Cashews", price: 25 },
      { name: "Extra Paneer Cubes", price: 30 },
      { name: "Extra Boondi Raita Bowl", price: 15 }
    ]
  },
  {
    id: "m6",
    name: "Crispy Gobi Manchurian & Veg Hakka Noodles Combo",
    category: "meals",
    price: 95,
    rating: 4.8,
    reviewsCount: 420,
    prepTime: "6 mins",
    calories: "490 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Desi Chinese Favorite",
    description: "Wok-tossed noodles with shredded bell peppers, cabbage, spring onions, paired with crispy cauliflower florets glazed in dark soy, garlic, and ginger sauce.",
    image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Schezwan Dip", price: 10 },
      { name: "Extra Manchurian Gravy", price: 20 }
    ]
  },

  // --- FAST FOOD & MAGGI ---
  {
    id: "f1",
    name: "KLE Special Cheese Tadka Maggi",
    category: "fastfood",
    price: 65,
    rating: 4.9,
    reviewsCount: 920,
    prepTime: "5 mins",
    calories: "380 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Campus Legend",
    description: "Double 2-minute noodles tossed in spicy butter garlic tadka, capsicum, sweet corn, and submerged under a blanket of melted mozzarella & cheddar cheese.",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Cheese Burst", price: 20 },
      { name: "Add Butter Sautéed Corn", price: 15 },
      { name: "Extra Butter & Peri-Peri Tadka", price: 15 }
    ]
  },
  {
    id: "f2",
    name: "Jumbo Paneer Tikka Grilled Sandwich",
    category: "fastfood",
    price: 85,
    rating: 4.8,
    reviewsCount: 460,
    prepTime: "7 mins",
    calories: "450 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Top Snack",
    description: "3-layer sandwich stuffed with tandoori spiced paneer cubes, capsicum, mint chutney, cheese slice, toasted crisp with salted butter and served with chips.",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Add Extra Cheese Slice", price: 20 },
      { name: "Add French Fries on Side", price: 35 }
    ]
  },
  {
    id: "f3",
    name: "Crispy Peri-Peri French Fries Basket",
    category: "fastfood",
    price: 60,
    rating: 4.7,
    reviewsCount: 380,
    prepTime: "4 mins",
    calories: "310 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Quick Crunch",
    description: "Golden crinkle-cut potatoes fried to perfection, tossed in African peri-peri spice dust, served with garlic mayo dip and tomato ketchup.",
    image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Cheesy Jalapeno Dip", price: 15 },
      { name: "Double Size Basket", price: 40 }
    ]
  },
  {
    id: "f4",
    name: "Veg Schezwan Crispy Frankie Roll",
    category: "fastfood",
    price: 55,
    rating: 4.6,
    reviewsCount: 275,
    prepTime: "5 mins",
    calories: "340 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "On the Go",
    description: "Flaky paratha roll lined with tangy chutney, wrapped around crispy spiced veg patty, onions, chaat masala, and house special Schezwan glaze.",
    image: "https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Add Grated Cheese", price: 15 },
      { name: "Add Paneer Cubes", price: 25 }
    ]
  },

  // --- SNACKS & CHAATS ---
  {
    id: "s1",
    name: "Hot Samosa Pav with Thecha (2 Pcs)",
    category: "snacks",
    price: 35,
    rating: 4.9,
    reviewsCount: 610,
    prepTime: "2 mins",
    calories: "320 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Budget King",
    description: "Freshly fried spiced potato samosas tucked inside ladi pavs, smeared with green mint chutney, sweet dates dip, and fiery Kolhapuri garlic thecha.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Fried Green Chilli", price: 0 },
      { name: "Add Cheese Slice", price: 15 }
    ]
  },
  {
    id: "s2",
    name: "Butter Pav Bhaji (Double Butter)",
    category: "snacks",
    price: 80,
    rating: 4.8,
    reviewsCount: 440,
    prepTime: "6 mins",
    calories: "490 kcal",
    isVeg: true,
    isSpicy: true,
    badge: "Bestseller",
    description: "Mumbai street style mashed vegetable bhaji cooked with aromatic spices, topped with melting butter cubes, served with 2 toasted pavs, onion & lime.",
    image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Pair of Butter Pav (2 pcs)", price: 20 },
      { name: "Extra Cheese Topping", price: 20 }
    ]
  },
  {
    id: "s3",
    name: "Dahi Papdi Chaat with Sev",
    category: "snacks",
    price: 55,
    rating: 4.7,
    reviewsCount: 220,
    prepTime: "3 mins",
    calories: "280 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Cool & Tangy",
    description: "Crisp wheat papdis topped with diced boiled potatoes, chilled sweetened yogurt, tangy tamarind chutney, mint dip, and a generous crunch of fine sev.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Dahi & Chutney", price: 10 }
    ]
  },
  {
    id: "s4",
    name: "Crisp Onion Pakoda with Cutting Chai",
    category: "snacks",
    price: 50,
    rating: 4.8,
    reviewsCount: 360,
    prepTime: "5 mins",
    calories: "350 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Monsoon Mood",
    description: "Crunchy golden gram flour fritters studded with sliced onions, carom seeds, and green chillies, served with fresh coconut chutney and hot tea.",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Chutney", price: 0 }
    ]
  },

  // --- BEVERAGES & COOLERS ---
  {
    id: "v1",
    name: "KLE Signature South Indian Filter Kaapi",
    category: "beverages",
    price: 25,
    rating: 5.0,
    reviewsCount: 1150,
    prepTime: "2 mins",
    calories: "90 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Must Try",
    description: "Frothy, strong Chicory-infused Arabica decoction blended with full-cream hot milk, poured from heights into traditional brass dabarah and tumbler.",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Strong Decoction", price: 5 },
      { name: "Sugar Free (Diabetic Friendly)", price: 0 }
    ]
  },
  {
    id: "v2",
    name: "Thick Cold Coffee with Vanilla Ice Cream",
    category: "beverages",
    price: 55,
    rating: 4.9,
    reviewsCount: 840,
    prepTime: "3 mins",
    calories: "280 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Student Essential",
    description: "Rich blended espresso coffee shake drizzled with Hershey's chocolate syrup and crowned with a scoop of creamy vanilla ice cream.",
    image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Add Extra Choco Fudge", price: 15 },
      { name: "Extra Scoop Ice Cream", price: 20 }
    ]
  },
  {
    id: "v3",
    name: "Alphonso Mango Lassi (Thick & Chilled)",
    category: "beverages",
    price: 50,
    rating: 4.8,
    reviewsCount: 390,
    prepTime: "3 mins",
    calories: "210 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Refreshing",
    description: "Thick hand-churned fresh yogurt blended with pure Alphonso mango pulp, a hint of cardamom, garnished with chopped pistachios & saffron.",
    image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Topped with Dry Fruits", price: 15 }
    ]
  },
  {
    id: "v4",
    name: "Adrak Elaichi Cutting Chai (2 Glasses)",
    category: "beverages",
    price: 30,
    rating: 4.9,
    reviewsCount: 970,
    prepTime: "2 mins",
    calories: "85 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Campus Ritual",
    description: "Slow-simmered Assam tea leaves crushed with fresh spicy ginger, green cardamom pods, and sweetened milk. Served piping hot in glasses.",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Less Sweet", price: 0 },
      { name: "Extra Ginger Zing", price: 0 }
    ]
  },
  {
    id: "v5",
    name: "Fresh Mint Lemonade Cooler",
    category: "beverages",
    price: 35,
    rating: 4.7,
    reviewsCount: 195,
    prepTime: "2 mins",
    calories: "60 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Summer Savior",
    description: "Freshly squeezed lemon juice, muddled fresh mint leaves, roasted cumin powder, black salt, and ice cold soda/water for instant hydration.",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Made with Chilled Soda", price: 10 }
    ]
  },

  // --- DESSERTS ---
  {
    id: "d1",
    name: "Hot Gulab Jamun with Vanilla Ice Cream",
    category: "desserts",
    price: 45,
    rating: 4.9,
    reviewsCount: 530,
    prepTime: "2 mins",
    calories: "310 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Sweet Tooth",
    description: "Two melt-in-mouth mawa gulab jamuns dunked in rose-cardamom saffron sugar syrup, served piping hot alongside a chilled scoop of vanilla ice cream.",
    image: "https://images.unsplash.com/photo-1667206565158-b63e8a4d455b?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra 1 Gulab Jamun", price: 15 }
    ]
  },
  {
    id: "d2",
    name: "Ghee Mysore Pak (Special Soft)",
    category: "desserts",
    price: 40,
    rating: 4.8,
    reviewsCount: 280,
    prepTime: "1 min",
    calories: "290 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Karnataka Pride",
    description: "Rich traditional melt-in-mouth gram flour sweet prepared with copious amounts of pure desi cow ghee. Fragrant, golden, and deeply satisfying.",
    image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80",
    customizations: []
  },
  {
    id: "d3",
    name: "Sizzling Chocolate Brownie with Fudge",
    category: "desserts",
    price: 85,
    rating: 4.9,
    reviewsCount: 470,
    prepTime: "4 mins",
    calories: "430 kcal",
    isVeg: true,
    isSpicy: false,
    badge: "Celebration",
    description: "Warm Belgian chocolate walnut brownie served on a hot sizzling cast iron skillet, topped with cold vanilla scoop and bubbling hot chocolate fudge.",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
    customizations: [
      { name: "Extra Choco Chips", price: 15 },
      { name: "Extra Ice Cream Scoop", price: 20 }
    ]
  }
];

// Special Campus Combos (Quick Bundles)
const CAMPUS_COMBOS = [
  {
    id: "combo-1",
    title: "Morning Lecture Booster",
    subtitle: "Quick Fuel Under 6 Mins",
    items: "1 Mysore Masala Dosa + 1 Crispy Vada + 1 Filter Kaapi",
    price: 85,
    originalPrice: 110,
    savings: "₹25 OFF",
    tag: "Morning Star",
    tagColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=800&q=80",
    itemIds: ["b1", "v1"]
  },
  {
    id: "combo-2",
    title: "Exam Night Grind Combo",
    subtitle: "High Energy Brain Fuel",
    items: "Cheese Tadka Maggi + Monster Cold Coffee with Ice Cream",
    price: 105,
    originalPrice: 125,
    savings: "₹20 OFF",
    tag: "Night Owl",
    tagColor: "bg-indigo-600",
    image: "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=800&q=80",
    itemIds: ["f1", "v2"]
  },
  {
    id: "combo-3",
    title: "Project Team Feast (For 2)",
    subtitle: "Share & Discuss Together",
    items: "2 Veg Biryanis + 2 Fresh Mint Lemonades + 2 Hot Gulab Jamun",
    price: 249,
    originalPrice: 320,
    savings: "₹71 OFF",
    tag: "Best Value",
    tagColor: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80",
    itemIds: ["m2", "v5", "d1"]
  }
];

// Live Canteen Counters Status (Simulated Real-Time)
const COUNTER_STATUSES = [
  {
    counterNumber: "Counter 1",
    name: "South Indian & Dosa Grill",
    currentChef: "Chef Mallikarjun",
    status: "Active",
    rushLevel: "Moderate", // Low, Moderate, Busy
    waitMins: 6,
    activeOrders: 8,
    servingToken: "#KLE-142",
    badgeClass: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    counterNumber: "Counter 2",
    name: "Hot Meals, Thalis & Biryani",
    currentChef: "Chef Ramesh Rao",
    status: "Smooth",
    rushLevel: "Low",
    waitMins: 4,
    activeOrders: 4,
    servingToken: "#KLE-139",
    badgeClass: "text-emerald-600 bg-emerald-50 border-emerald-200"
  },
  {
    counterNumber: "Counter 3",
    name: "Maggi, Sandwiches & Chaat Bar",
    currentChef: "Chef Sunil Kumar",
    status: "High Rush",
    rushLevel: "Busy",
    waitMins: 9,
    activeOrders: 14,
    servingToken: "#KLE-145",
    badgeClass: "text-rose-600 bg-rose-50 border-rose-200"
  },
  {
    counterNumber: "Counter 4",
    name: "Filter Kaapi & Cold Drinks",
    currentChef: "Barista Priya",
    status: "Instant",
    rushLevel: "Low",
    waitMins: 2,
    activeOrders: 3,
    servingToken: "#KLE-148",
    badgeClass: "text-emerald-600 bg-emerald-50 border-emerald-200"
  }
];

// Initial Student Reviews
const INITIAL_REVIEWS = [
  {
    id: "r1",
    name: "Rahul Patil",
    role: "BCA, 6th Sem",
    rating: 5,
    date: "Yesterday",
    comment: "The Mysore Masala Dosa is elite! The pre-ordering feature saved me today during the 15-minute break between BCA Labs. Food was piping hot when I reached Counter 1.",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
  },
  {
    id: "r2",
    name: "Sneha Kulkarni",
    role: "BA, 6th Sem",
    rating: 5,
    date: "2 days ago",
    comment: "KLE Special Filter Kaapi at ₹25 is the only thing keeping our batch awake in morning lectures. Also love that they maintain 100% hygiene and clean tables.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80"
  },
  {
    id: "r3",
    name: "Darshan Hiremath",
    role: "BBA, 4th Sem",
    rating: 5,
    date: "3 days ago",
    comment: "Unlimited South Indian Thali for ₹95 with payasam is hands down the best meal in Gokak campus! Fresh, tasty, and easy on the wallet.",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80"
  },
  {
    id: "r4",
    name: "Pooja Hegde",
    role: "B.COM, 4th Sem",
    rating: 5,
    date: "Last week",
    comment: "Cheese Tadka Maggi + Cold coffee combo during exams week was a lifesaver. UPI payment and live token queue makes it super smooth.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80"
  }
];

// Coupon Codes
const PROMO_CODES = {
  "KLESTUDENT": { discountPercent: 15, maxDiscount: 50, label: "15% Student Discount Applied" },
  "EXAMFUEL": { discountFlat: 20, minSpend: 100, label: "₹20 Flat Off on Exam Munchies" },
  "FIRSTBITE": { discountPercent: 10, maxDiscount: 30, label: "10% Welcome Discount" }
};

// Campus Info
const CAMPUS_INFO = {
  collegeName: "KLE Society's College of BCA, Gokak",
  courses: ["BCA", "B.COM", "BBA", "BA"],
  location: "Near Byalikata, Gokak, Karnataka",
  phone: "+91 8332 225566",
  manager: "Shri Mahantesh (Canteen Manager)"
};

// Registered Sample Students for USN & DOB Login (BCA, B.COM, BBA, BA)
const REGISTERED_STUDENTS = [
  {
    usn: "U15GK22BCA018",
    dob: "15/08/2004", // DD/MM/YYYY
    name: "Rahul Patil",
    branch: "BCA (Bachelor of Computer Applications)",
    semester: "6th Sem",
    phone: "98451 22334"
  },
  {
    usn: "U15GK23BCM042",
    dob: "05/12/2005",
    name: "Pooja Hegde",
    branch: "B.COM (Bachelor of Commerce)",
    semester: "4th Sem",
    phone: "94821 44556"
  },
  {
    usn: "U15GK23BBA015",
    dob: "20/03/2003",
    name: "Darshan Hiremath",
    branch: "BBA (Bachelor of Business Admin)",
    semester: "4th Sem",
    phone: "99001 77889"
  },
  {
    usn: "U15GK22BA009",
    dob: "12/06/2004",
    name: "Sneha Kulkarni",
    branch: "BA (Bachelor of Arts)",
    semester: "6th Sem",
    phone: "98801 55667"
  }
];

// Seed Kitchen Orders (for Canteen Staff / Kitchen Portal)
const SEED_KITCHEN_ORDERS = [
  {
    id: "ord-101",
    token: "#KLE-139",
    usn: "2KL22EC092",
    studentName: "Sneha Patil",
    counter: "Counter 1 (South Indian & Dosa)",
    status: "ready", // 'pending', 'cooking', 'ready', 'completed'
    timestamp: "12:40 PM",
    prepMinutes: 0,
    items: [
      { name: "Mysore Masala Dosa", quantity: 1, price: 65, customizations: [{ name: "Extra Pure Ghee", price: 15 }] },
      { name: "KLE Signature Filter Kaapi", quantity: 1, price: 25, customizations: [] }
    ],
    subtotal: 105,
    discount: 15,
    total: 90,
    paymentMethod: "UPI (Google Pay)"
  },
  {
    id: "ord-102",
    token: "#KLE-142",
    usn: "2KL21CS004",
    studentName: "Aditya Kulkarni",
    counter: "Counter 2 (Hot Meals & Thalis)",
    status: "cooking",
    timestamp: "12:45 PM",
    prepMinutes: 3,
    items: [
      { name: "KLE Royal South Indian Thali", quantity: 1, price: 95, customizations: [{ name: "Add 2 Hot Chapatis", price: 20 }] }
    ],
    subtotal: 115,
    discount: 0,
    total: 115,
    paymentMethod: "Campus Smart Card"
  },
  {
    id: "ord-103",
    token: "#KLE-145",
    usn: "2KL23CS112",
    studentName: "Kiran Kumar",
    counter: "Counter 3 (Maggi & Chaat Corner)",
    status: "pending",
    timestamp: "12:51 PM",
    prepMinutes: 6,
    items: [
      { name: "KLE Special Cheese Tadka Maggi", quantity: 2, price: 65, customizations: [{ name: "Extra Cheese Burst", price: 20 }] },
      { name: "Thick Cold Coffee with Vanilla Ice Cream", quantity: 1, price: 55, customizations: [] }
    ],
    subtotal: 225,
    discount: 20,
    total: 205,
    paymentMethod: "UPI (PhonePe)"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    MENU_ITEMS,
    PROMO_CODES,
    CAMPUS_INFO,
    REGISTERED_STUDENTS,
    SEED_KITCHEN_ORDERS,
    COUNTER_STATUSES,
    INITIAL_REVIEWS
  };
}
