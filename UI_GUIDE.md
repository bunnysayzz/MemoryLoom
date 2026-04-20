# MemoryLoom UI Guide

## 🎨 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 MemoryLoom                              [API Key Button] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Connect Your Editor                                          │
│  [Claude] [Cursor] [VS Code] [Windsurf] [Zed] ...           │
│                                                               │
│  Available Memory Tools                                       │
│  [add_memory] [search_memories] [get_memories] ...           │
│                                                               │
│  Memory Management                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 📊       │ │ ✅       │ │ 📦       │ │ 💾       │       │
│  │ Total: 5 │ │ Active:4 │ │ Archived │ │ JSON     │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                                                               │
│  [Search memories...........................] [🔍 Search]    │
│  [All Projects ▼] [All Users ▼] [All Types ▼]               │
│  [🔄 Refresh] [➕ Add Memory]                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Memory Card                                          │    │
│  │ ID: abc-123-def                                      │    │
│  │ [Importance: 80%] [Confidence: 100%]        [✏️][🗑️]│    │
│  │                                                       │    │
│  │ This is the memory content that was stored...        │    │
│  │                                                       │    │
│  │ 👤 user  📁 project  🏷️ type  📅 2024-01-15        │    │
│  │ [tag1] [tag2]                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  Server Health                                                │
│  [✅ Online] [/health] [/ready] [/mcp]                       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│  MemoryLoom                          [GitHub 🐙] [Apple 🍎] │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Components

### 1. Header
```
┌─────────────────────────────────────────┐
│ 🧠 MemoryLoom          [API Key Button] │
└─────────────────────────────────────────┘
```
- Logo and title
- API Key settings button

### 2. Stats Dashboard
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 📊       │ │ ✅       │ │ 📦       │ │ 💾       │
│ Total    │ │ Active   │ │ Archived │ │ Storage  │
│ 5        │ │ 4        │ │ 1        │ │ JSON     │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```
- Real-time stats
- Hover effects
- Auto-updates

### 3. Search & Filters
```
┌─────────────────────────────────────────────┐
│ [Search memories...........] [🔍 Search]    │
│ [All Projects ▼] [All Users ▼] [All Types ▼]│
│ [🔄 Refresh] [➕ Add Memory]                 │
└─────────────────────────────────────────────┘
```
- Full-text search
- Dynamic filters
- Quick actions

### 4. Memory Card
```
┌─────────────────────────────────────────────┐
│ ID: abc-123-def-456                          │
│ [Importance: 80%] [Confidence: 100%] [✏️][🗑️]│
│                                              │
│ Memory content goes here...                  │
│                                              │
│ 👤 user  📁 project  🏷️ type  📅 date      │
│ [tag1] [tag2] [tag3]                        │
└─────────────────────────────────────────────┘
```
- All memory details
- Edit/Delete actions
- Metadata display
- Tags

### 5. Add/Edit Modal
```
┌─────────────────────────────────────────┐
│ Add Memory                          [×] │
├─────────────────────────────────────────┤
│ Content *                               │
│ [...................................]   │
│                                         │
│ Importance [0.5] Confidence [1.0]       │
│ User [default]  Project [general]       │
│ Type [general]  Source [manual]         │
│ Tags [tag1, tag2, tag3]                 │
│                                         │
│              [Cancel] [Save Memory]     │
└─────────────────────────────────────────┘
```
- All fields
- Validation
- Save/Cancel

### 6. Delete Modal
```
┌─────────────────────────────────────────┐
│ Delete Memory                       [×] │
├─────────────────────────────────────────┤
│ Are you sure you want to delete this    │
│ memory?                                  │
│                                         │
│ ☐ Permanently delete (cannot be undone) │
│                                         │
│              [Cancel] [Delete]          │
└─────────────────────────────────────────┘
```
- Confirmation
- Hard delete option
- Cancel/Confirm

### 7. Footer
```
┌─────────────────────────────────────────┐
│ MemoryLoom          [GitHub 🐙] [🍎]    │
└─────────────────────────────────────────┘
```
- Clean design
- Social links
- Hover effects

## 🎯 User Flow

### Adding a Memory
1. Click "➕ Add Memory"
2. Fill in content (required)
3. Set importance/confidence (optional)
4. Add metadata (optional)
5. Click "Save Memory"
6. ✅ Memory appears in list
7. ✅ Saved to database

### Editing a Memory
1. Click "✏️" on memory card
2. Modal opens with current data
3. Modify fields
4. Click "Save Memory"
5. ✅ Memory updates in list
6. ✅ Changes saved to database

### Deleting a Memory
1. Click "🗑️" on memory card
2. Confirmation modal appears
3. Choose archive or permanent delete
4. Click "Delete"
5. ✅ Memory removed from list
6. ✅ Changes saved to database

### Searching Memories
1. Type in search box
2. Press Enter or click "🔍 Search"
3. ✅ Results appear instantly
4. ✅ Relevance-based ranking

### Filtering Memories
1. Select filter from dropdown
2. ✅ List updates automatically
3. Combine multiple filters
4. ✅ Results match all filters

## 🎨 Color Coding

### Badges
- **Importance**: 🟡 Amber background
- **Confidence**: 🔵 Aqua background
- **Archived**: 🔴 Red background

### Buttons
- **Primary**: Aqua gradient
- **Ghost**: Transparent with border
- **Danger**: Red solid
- **Icon**: Aqua outline

### States
- **Success**: ✅ Green
- **Warning**: ⚠️ Amber
- **Error**: ❌ Red
- **Loading**: 🔄 Aqua spinner

## 📱 Responsive Design

### Desktop (> 980px)
- 4-column stats grid
- 2-column memory cards
- Full-width search/filters

### Tablet (680px - 980px)
- 2-column stats grid
- 1-column memory cards
- Wrapped filters

### Mobile (< 680px)
- 2-column stats grid
- 1-column memory cards
- Stacked search/filters
- Full-width buttons

## ⚡ Performance

### Loading States
- Spinner animation while fetching
- "Loading memories..." message
- Smooth transitions

### Empty States
- Friendly icon (📝)
- Helpful message
- Call-to-action

### Error States
- Warning icon (⚠️)
- Error message
- Retry option

## 🔒 Security

### API Authentication
- API key required for all operations
- Automatic key fetching
- Bearer token authentication

### Input Sanitization
- HTML escaping for content
- XSS prevention
- Content length limits

### CORS
- Enabled for cross-origin
- Proper headers
- Secure defaults

## ✨ Animations

### Hover Effects
- Cards lift on hover
- Buttons change color
- Icons scale up

### Modal Animations
- Fade-in background
- Slide-up content
- Smooth transitions

### Loading
- Rotating spinner
- Pulsing dots
- Fade transitions

## 🎉 Features Summary

✅ Real-time stats dashboard
✅ Full CRUD operations
✅ Search with relevance ranking
✅ Multi-filter support
✅ Modal dialogs
✅ Loading states
✅ Empty states
✅ Error handling
✅ Mobile responsive
✅ Accessibility (ARIA labels)
✅ Database persistence
✅ API authentication
✅ XSS protection
✅ Clean design
✅ Smooth animations

**Everything works and persists to the database!**
