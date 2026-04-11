<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">AI Agent Restaurant Backend</h1>

<p align="center">
  The backend that powers <a href="https://github.com/buzadandeveloper/ai-agent-restaurant-frontend">AI Restaurant Dashboard</a> and <a href="https://github.com/buzadandeveloper/ai-restaurant-widget">AI Restaurant Widget</a>
</p>

## 💡 Concept

This is a **MVP** that demonstrates how AI agents can transform restaurant operations. The backend is the brain of a 3-part system:

1. **Dashboard** - Where restaurant owners manage their business
2. **Widget** - Where customers interact with the AI agent
3. **Backend** - The intelligence that connects everything

**Two deployment models:**
- 🍔 **Drive-Thru/Kiosk Mode** - AI completely replaces the speaker operator
- 🏪 **Restaurant Mode** - AI takes orders from customers (traditional waiter just processes payment/delivery)

## 🏗️ The Complete Solution

### 🏢 [AI Restaurant Dashboard](https://github.com/buzadandeveloper/ai-agent-restaurant-frontend)
**What it is:** Admin interface for restaurant owners

**What owners do here:**
- Create restaurants and set up basic info
- Create menu categories (appetizers, mains, desserts, etc.)
- Add menu items with prices, descriptions, allergen info
- Create tables in the restaurant
- View revenue statistics and order history
- **Get a `configKey`** - a unique identifier that connects to the widget

**Why it matters:**
Without this, the AI agent wouldn't know what menu items exist or what the restaurant structure is. The configKey is like a "key to the restaurant" that the widget uses to load all the data.

---

### 🤖 [AI Restaurant Widget](https://github.com/buzadandeveloper/ai-restaurant-widget)
**What it is:** A widget that can be embedded on any website or display in the restaurant

**What customers do here:**
- Enters the configKey to connect to a specific restaurant
- Talks to the AI in natural language (Romanian, English, etc.)
- Asks for menu items, makes orders, asks questions
- The AI understands and processes orders in real-time
- Customers can pay bills

**How it works:**
1. Widget receives configKey from the restaurant owner
2. Widget calls the backend to create an AI session
3. Backend loads restaurant data (menus, tables) into the AI's memory
4. AI agent (powered by OpenAI Realtime, DeepSeek, or any Realtime API) has full context
5. Customer talks to AI → AI understands → AI calls backend tools
6. Orders are created, items added, bills paid - all through conversation

**Why it's powerful:**
The widget can be embedded anywhere - on a website, a QR code in a restaurant, a kiosk display. Any interface can become a restaurant AI assistant.

---

## 🔗 How It All Works Together

### Key Insight: The Backend Architecture

This backend is **provider-agnostic**. It doesn't care if you use OpenAI, DeepSeek, Anthropic, or any other AI service with a Realtime API. The credentials are managed by the Widget, not the backend.

```
STEP 1: RESTAURANT SETUP (Dashboard)
┌─────────────────────────────────┐
│ Owner creates restaurant        │
│ Sets up menus & tables          │
│ Gets configKey (e.g. "acc_123") │
└──────────────┬──────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│         BACKEND (This Project)           │
│  Stores: Users, Restaurants, Menus,      │
│          Tables, Orders, Stats           │
└──────────────────────────────────────────┘
               ▲
               │
STEP 2: AI WIDGET ACTIVATION (Widget)
               │
┌──────────────┴──────────────────────────────────────┐
│ Widget receives configKey from owner                │
│ Owner also configures AI provider:                  │
│  - OpenAI URL + API key, OR                         │
│  - DeepSeek URL + API key, OR                       │
│  - Any other Realtime API provider                  │
│ Widget calls backend: "Create session"              │
│ (sends AI credentials in headers)                   │
└──────────────┬──────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         BACKEND (This Project)          │
│ - Finds user by configKey               │ 
│ - Loads restaurant data                 │
│ - Creates knowledge base (menus, etc.)  │
│ - Uses AI credentials from headers      │
│ - Sends to AI provider (OpenAI, etc.)   │
│ - Returns session token to widget       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ Widget gets session token                │
│ AI agent (on widget) now has context     │
│ Customer can talk to AI                  │
└──────────────────────────────────────────┘

STEP 3: LIVE INTERACTION (Widget + Backend)

Customer: "I want 2 burgers and a salad for table 5"
                    ↓
AI Agent (on widget, powered by the AI provider) understands
                    ↓
AI calls backend tool: /api/ai-agent/tool/create-order
{
  "restaurantId": 1,
  "tableId": 5,
  "items": [
    {"menuItemId": 12, "quantity": 2},    // burgers
    {"menuItemId": 8, "quantity": 1}      // salad
  ]
}
                    ↓
Backend validates & creates order in database
                    ↓
Backend returns: "Order confirmed"
                    ↓
AI confirms to customer: "Your order is ready!"
```

### The Beauty of This Architecture:

- **Backend never touches AI provider keys** - Stays secure
- **Any AI provider can be used** - OpenAI, DeepSeek, Anthropic, etc.
- **Easy to switch providers** - No backend changes needed
- **Provider credentials managed by Widget** - Separation of concerns
- **Backend focused on business logic** - Orders, menus, restaurants

---

## 🤔 Why This Is Perfect for Restaurants

### The Core Problem in Food Service:
Restaurants lose money and efficiency because **order-taking is broken**:

❌ **Drive-Thru:** Speaker operators mishear orders, customers get wrong items, lines back up  
❌ **Restaurant:** Waiters spend time writing orders instead of providing service  
❌ **Both:** Staff turnover is high, training costs are high, mistakes happen daily  
❌ **Both:** During peak hours, one waiter can't handle 20 tables or one speaker operator can't handle the queue  

### The AI Solution:

This backend **automates the order-taking layer** while keeping human staff for what they do best - service and customer experience.

---

### 🍔 **For Drive-Thru / Kiosk Operations:**

**What Changes:**
- ❌ Old: Customer pulls up → Speaker operator takes order (mishears, slow, one operator bottleneck)
- ✅ New: Customer pulls up → AI greets instantly → Takes order perfectly → Sends to kitchen → Processes payment

**Why It's a Game-Changer:**
1. **No More Order Mistakes** - AI never mishears "Big Mac" as "Big Mac Extra"
2. **Infinite Capacity** - One AI backend handles 1,000 orders/hour across 100+ locations
3. **24/7 Operations** - Doesn't need breaks, sick days, or training
4. **Cost Savings** - Remove speaker operator salaries across all locations (McDonald's: save millions per year)
5. **Consistent Quality** - Every customer gets the same perfect experience
6. **Multiple Languages** - "大麦克" (Chinese), "بيج ماك" (Arabic) - same AI handles all

**The Numbers:**
- 1 speaker operator = ~20 orders/hour = 1 bottleneck
- 1 AI backend = 1,000+ orders/hour = scales infinitely
- **ROI:** Pay for the backend in weeks with labor savings

---

### 🏪 **For Traditional Restaurants:**

**What Changes:**
- ❌ Old: Customer sits → Waiter comes → Customer orders → Waiter writes → Waiter inputs → Kitchen cooks (waiter is busy with just order-taking)
- ✅ New: Customer sits → Scans QR → Talks to AI → Order goes straight to kitchen (waiter is free to provide service)

**Why It's Revolutionary:**
1. **Waiter Can Focus on Service** - No more writing notes, remembering orders, navigating terminals
2. **Handle More Tables** - One waiter can now serve 30 tables instead of 10 (AI takes orders for all of them simultaneously)
3. **Better Customer Experience** - Waiter provides actual service (refills, recommendations, checking satisfaction)
4. **No Miscommunications** - AI never forgets "no onions" or "extra sauce"
5. **Faster Seating** - Customers don't wait for waiter to come take their order - AI is instant
6. **Peak Hour Solution** - During rush hours, AI doesn't get overwhelmed (humans do, AI doesn't)

**Staff Satisfaction:**
- Waiters actually enjoy their job more (service, not paperwork)
- Less stress from angry customers about wrong orders
- Can handle busy nights without feeling overwhelmed

---

### ⚡ **Universal Benefits (Drive-Thru + Restaurant):**

| Problem | AI Solution |
|---------|------------|
| **Mistakes in orders** | AI hears perfectly, never forgets items |
| **Customer wait time** | Instant order taking (no waiter needed to show up) |
| **Peak hour bottleneck** | Infinite capacity - 1 AI handles 100+ simultaneous customers |
| **Labor costs** | Remove expensive staff from order-taking, keep them for service |
| **24/7 availability** | AI never sleeps, never calls in sick |
| **Training new staff** | AI needs zero training, zero onboarding |
| **Language barrier** | Supports all languages seamlessly |
| **Consistency** | Every customer gets the exact same quality experience |
| **Scalability** | One backend serves 1 restaurant or 1,000 restaurants |
| **Integration** | Works on website, kiosk, QR code, delivery app, drive-thru speaker |  

### Real-World Use Cases:

**DRIVE-THRU / KIOSK (Complete Replacement):**

1. **McDonald's Drive-Thru** ⭐ (Real Example)
   - **Old way:** Customer pulls up → Speaker operator takes order → Kitchen gets order
   - **New way:** Customer pulls up → AI greets them → Takes order → Sends to kitchen → Takes payment
   - **Benefit:** No miscommunications, 24/7 availability, one backend serves 100+ locations
   - Cost savings: Remove salary for speakers operators across all locations

2. **Restaurant Self-Service Kiosk**
   - Customer walks in → Uses AI kiosk → Orders themselves
   - AI recommends dishes, handles questions
   - Staff delivers food, provides service

---

**TRADITIONAL RESTAURANT (Order Taking Automation):**

3. **Fine Dining / Casual Restaurant**
   - Customer sits at table → Scans QR code
   - AI takes their order via conversation
   - Waiter brings food, handles payment, provides service
   - Staff freed from order-taking → Better customer experience
   - AI handles multiple tables simultaneously

4. **Multi-Table Service**
   - One waiter can focus on 20 tables at once
   - AI handles order taking for all of them
   - Waiter just delivers and manages service

---

**OTHER DEPLOYMENT MODELS:**

5. **Website Integration**
   - Restaurant website has embedded widget
   - Online customers can pre-order via AI before visiting

6. **Delivery Partner Integration**
   - Widget embedded in delivery apps (UberEats, Glovo, etc.)
   - Customers order from their favorite restaurants via AI

7. **Multi-Restaurant Network**
   - One backend serves 100+ restaurants (chains or franchises)
   - Each restaurant has own widget with its configKey
   - All data isolated and secure

---

## 🛠️ Technology Stack

**Backend (This Project):**
- **NestJS 11.x** - Robust Node.js framework
- **PostgreSQL** - Reliable database
- **Prisma ORM** - Type-safe database queries
- **JWT** - Secure authentication

**AI Integration:**
- **OpenAI Realtime API** (primary)
- **DeepSeek Realtime** (alternative)
- **Any provider with Realtime API** (extensible)

**Communication:**
- Backend provides knowledge base (menus, tables) to AI
- Backend processes tool calls (create order, add items, pay)
- Backend validates and stores everything in database

---

## 🧠 How AI Gets Knowledge Base & Instructions

This is the core of how the AI agent works. The backend **doesn't store AI provider credentials**, but it **does build the intelligence context** that the AI uses to make decisions.

### 📚 The Knowledge Base Flow

**Step 1: Customer Creates AI Session**

```
Widget (Dashboard/Restaurant)
  ↓
Owner clicks "Create AI Session" with configKey
  ↓
Widget calls: POST /api/ai-agent/session
Headers:
  - X-Config-Key: "acc_restaurant_123"
  - X-AI-Provider-URL: "https://api.openai.com/v1/realtime/sessions"
  - X-AI-Provider-Key: "sk-proj-xxxxxxxx"
```

**Step 2: Backend Loads Restaurant Data**

```
Backend receives configKey from headers
  ↓
Query Database:
  ✅ Find user by configKey
  ✅ Get all restaurants for that user
  ✅ For EACH restaurant, load:
     • Restaurant details (name, address, currency)
     • ALL menu items (with prices, descriptions, ingredients)
     • ALL tables (with IDs and numbers)
     • ALL categories (appetizers, mains, desserts, etc.)
  ↓
BUILD KNOWLEDGE BASE OBJECT
{
  "restaurants": [
    {
      "id": 1,
      "name": "Pizza Italia",
      "address": "Strada Principala 42",
      "currency": "MDL",
      "tables": [
        {"id": 1, "tableNumber": 1},
        {"id": 2, "tableNumber": 2},
        ...
      ],
      "menu": [
        {
          "id": 10,
          "name": "Pizza Margherita",
          "description": "Classic pizza with tomato and mozzarella",
          "price": 90,
          "currency": "MDL",
          "category": "Pizza"
        },
        {
          "id": 11,
          "name": "Caesar Salad",
          "price": 45,
          "currency": "MDL",
          "category": "Salads"
        },
        ...
      ]
    }
  ]
}
```

**Step 3: Backend Generates AI Instructions**

The backend calls `getInstructions(knowledgeBase)` which creates a comprehensive prompt for the AI:

```typescript
// File: src/modules/ai-agent/utils/get-instructions.ts

export const getInstructions = (knowledgeBase: KnowledgeBaseData) => {
  return `
    ========================================
    GUARDRAILS (STRICT SAFETY RULES)
    ========================================
    
    ACCEPTED LANGUAGES: Romanian, Russian, English
    ALLOWED TOPICS: Food orders, Menu, Bill payment, Restaurant info
    
    [... detailed behavior rules ...]
    
    ========================================
    KNOWLEDGE BASE (Structured JSON Data)
    ========================================
    ${JSON.stringify(knowledgeBase, null, 2)}
    
    ========================================
    MANDATORY ORDER FLOW
    ========================================
    
    STEP 1 — Identify the restaurant
    STEP 2 — Identify the table
    STEP 3 — Take the order
    STEP 3.5 — Order Confirmation (MANDATORY VERIFICATION)
    STEP 4 — Paying the bill
    
    [... detailed instructions for each step ...]
  `;
};
```

**What This Instruction Prompt Contains:**

| Section | Purpose | Example |
|---------|---------|---------|
| **Guardrails** | Safety rules, language limits | Only Romanian, Russian, English |
| **Identity** | What the AI is | Virtual restaurant assistant |
| **Language Settings** | Default & switching rules | Start in Romanian, switch if needed |
| **Currencies** | How to communicate prices | "90 lei" not "90 MDL" |
| **Knowledge Base** | Restaurant data in JSON | All menus, tables, prices |
| **Order Flow** | Step-by-step instructions | Identify restaurant → table → order → confirm → pay |
| **Important Rules** | Mandatory behaviors | Always recap order before confirming |
| **Available Tools** | What the AI can do | create_order, add_items_to_order, pay_bill |

**Step 4: Backend Sends to AI Provider**

```
Backend creates request to AI Provider (OpenAI, DeepSeek, etc.):

POST https://api.openai.com/v1/realtime/sessions
Authorization: Bearer sk-proj-xxxxxxxx
Content-Type: application/json

{
  "model": "gpt-4-realtime-preview-2024-12-17",
  "modalities": ["text", "audio"],
  "instructions": "Bună ziua! Bine ați venit... [FULL INSTRUCTION PROMPT]",
  "tools": [
    {
      "type": "function",
      "name": "create_order",
      "description": "Create a new order for a table",
      "parameters": {
        "restaurantId": "...",
        "tableId": "...",
        "items": [...]
      }
    },
    {
      "type": "function",
      "name": "add_items_to_order",
      "description": "Add items to existing order"
    },
    {
      "type": "function",
      "name": "pay_bill",
      "description": "Process payment for a table"
    }
  ]
}
  ↓
AI Provider returns: session_token + client_secret
```

**Step 5: Backend Returns Session to Widget**

```json
{
  "sessionToken": "sess_abc123xyz",
  "clientSecret": "sk-client-secret",
  "restaurantId": 1,
  "knowledgeBase": {
    "restaurants": [...],
    "menus": [...]
  }
}
```

**Step 6: Widget Initializes AI**

```javascript
// On the Widget (Frontend)
const session = await fetch('/api/ai-agent/session');
const { sessionToken, clientSecret } = session.json();

// Initialize OpenAI Realtime Client
const client = new RealtimeClient({
  apiKey: sessionToken,
  model: 'gpt-4-realtime-preview',
  // ... rest of configuration
});

// Now customer can talk to AI
client.connect();
```

---

### 🔧 How AI Calls Backend Tools

When the customer orders something, here's what happens:

**Customer says:** "I want 2 pizzas for table 5"

**AI processes this:**
1. AI understands the intent (order taking)
2. AI finds "Pizza" in knowledgeBase.menu
3. AI needs to call the `create_order` tool
4. AI sends to backend:

```json
{
  "type": "function",
  "name": "create_order",
  "arguments": {
    "restaurantId": 1,
    "tableId": 5,
    "items": [
      {
        "menuItemId": 10,
        "quantity": 2
      }
    ]
  }
}
```

**Backend receives the tool call:**

```typescript
// File: src/modules/ai-agent/ai-agent.controller.ts

@Post('tool/create-order')
async createOrder(@Body() payload: CreateOrderPayload) {
  // 1. Validate restaurantId exists
  // 2. Validate tableId exists in that restaurant
  // 3. Validate all menuItemIds exist
  // 4. Create order in database
  // 5. Return confirmation
  
  return {
    success: true,
    orderId: "ord_456",
    message: "Order created successfully"
  };
}
```

**Backend returns success:**

```json
{
  "success": true,
  "orderId": "ord_456",
  "message": "Order created successfully"
}
```

**AI acknowledges to customer:** "Perfect! I've created your order for table 5 with 2 pizzas."

---

### 📊 Knowledge Base Structure in Detail

The knowledge base sent to AI contains EVERYTHING the AI needs to know:

```json
{
  "restaurants": [
    {
      "id": 1,
      "name": "Pizza Italia",
      "address": "Strada Principala 42, Chisinau",
      "currency": "MDL",
      "tables": [
        {
          "id": 1,
          "tableNumber": 1,
          "seats": 4
        },
        {
          "id": 2,
          "tableNumber": 2,
          "seats": 2
        }
      ],
      "menu": [
        {
          "id": 10,
          "name": "Pizza Margherita",
          "description": "Classic Italian pizza with tomato, mozzarella, and basil",
          "price": 90,
          "currency": "MDL",
          "category": "Pizza",
          "ingredients": ["tomato", "mozzarella", "basil", "olive oil"]
        },
        {
          "id": 11,
          "name": "Pizza Quattro Formaggi",
          "description": "Four cheese pizza",
          "price": 110,
          "currency": "MDL",
          "category": "Pizza",
          "ingredients": ["mozzarella", "gorgonzola", "parmesan", "ricotta"]
        },
        {
          "id": 12,
          "name": "Caesar Salad",
          "description": "Fresh romaine lettuce with Caesar dressing and croutons",
          "price": 45,
          "currency": "MDL",
          "category": "Salads"
        }
      ]
    }
  ]
}
```

### 🎯 Why This Architecture is Powerful

| Aspect | Benefit |
|--------|---------|
| **Knowledge in Instructions** | AI knows menu BEFORE customer talks to it |
| **Real-time Validation** | Backend validates every order against real database |
| **Language Flexibility** | Instructions in Romanian, but customer can switch languages |
| **Tool Availability** | AI knows exactly what tools it can call (create_order, pay_bill, etc.) |
| **Scalability** | One backend loads knowledge for 1 or 1000 restaurants |
| **Security** | AI credentials never stored in backend, only restaurant data |
| **Customization** | Each restaurant has unique instructions based on their menu |

### 🔐 Security Considerations

- **AI Provider Keys:** Passed in headers by Widget, never stored in backend
- **Restaurant Data:** Isolated per user via configKey
- **Tool Calls:** Backend validates every request (restaurantId, tableId, menuItemId)
- **Database Queries:** Using Prisma ORM (SQL injection protected)
- **JWT Authentication:** User must be authenticated to create AI session

---

## 🚀 Setup & Running

### Prerequisites
```
- Node.js (v18+)
- PostgreSQL database
- SendGrid API key (for email verification only)
```

**Note:** You do NOT need OpenAI, DeepSeek, or any AI provider API keys in the backend. These are configured in the Widget and passed to the backend via headers when creating AI sessions.

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate deploy
```

### Environment Configuration

Create `.env` file with these minimal required variables:

```env
# Database Connection (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/ai_restaurant_db

# JWT Security (Required - CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=7d

# SendGrid Email Service (Required - for account verification)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourapp.com

# URLs
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173  # Your Widget/Dashboard URL

# Server Port
PORT=3000
```

**That's it!** No need for AI provider keys here.

### Running

```bash
# Development (auto-reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

API available at: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/api/docs`

---

## 🤖 How AI Providers Are Connected

**This is the key architectural difference:**

❌ **Old way:** Backend stores OpenAI keys, connects directly to AI  
✅ **New way:** Widget sends AI provider credentials to backend via headers

### Flow:

```
Widget (Dashboard/Restaurant UI)
  ↓
User enters AI Provider credentials
(OpenAI API key, DeepSeek key, etc.)
  ↓
User clicks "Create AI Session"
  ↓
Widget calls: POST /api/ai-agent/session
With Headers:
  - X-AI-Provider-URL: https://api.openai.com/v1/realtime/sessions
  - X-AI-Provider-Key: sk-proj-xxxxxxxx

Backend receives:
  ✅ Load restaurant data by configKey
  ✅ Forward credentials to AI provider
  ✅ Get session token from AI provider
  ✅ Return session token to Widget

Widget uses session token
  ✅ Start real-time AI conversation
  ✅ AI calls backend tools (create-order, add-items, pay-bill)
```

### Why This Architecture?

1. **Backend stays agnostic** - Works with any AI provider (OpenAI, DeepSeek, Anthropic, etc.)
2. **Security** - AI credentials never stored in backend
3. **Flexibility** - Each restaurant can use different AI providers
4. **Scalability** - No backend redeployment needed when switching providers
5. **Cost Control** - Each user pays for their own AI provider usage

### Supported AI Providers:

Any provider with a **Realtime API** that accepts:
- POST request to create sessions
- Bearer token authentication
- Tool calling capability

**Examples:**
- ✅ OpenAI Realtime API
- ✅ DeepSeek Realtime API
- ✅ Any compatible provider with similar architecture

## 🎯 The MVP Vision

This is **NOT** a complete restaurant POS system. It's a **proof of concept** showing how AI can replace waiters and operators.

**What it does:**
- ✅ Restaurant owners set up their restaurant once
- ✅ Customers interact with AI via widget
- ✅ Orders are processed and stored
- ✅ Revenue is tracked

**What it doesn't cover:**
- Kitchen workflow (chef notifications)
- Payment processing (Stripe, card payments)
- Staff management
- Inventory tracking

**But** the architecture supports all of these additions because:
- Database is normalized and extensible
- Backend APIs are modular
- Widget and dashboard can grow independently

---

## 🌍 Why This Matters for Restaurants

This solution allows **any restaurant** to:
- Deploy AI waiters in minutes
- Reduce labor costs significantly
- Improve customer satisfaction
- Scale to multiple locations
- Integrate with existing systems

The backend makes this possible because it:
1. **Understands the restaurant structure** (menus, tables)
2. **Talks to any AI provider** (OpenAI, DeepSeek, etc.)
3. **Processes orders reliably** (validation, storage)
4. **Isolates data per restaurant** (security & privacy)
5. **Scales infinitely** (one backend, unlimited restaurants)
