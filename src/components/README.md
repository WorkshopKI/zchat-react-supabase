# Component Architecture

This directory contains the refactored component structure for ZChat, organized for maintainability and reusability.

## Directory Structure

```
src/
├── components/
│   ├── modals/                     # Modal components
│   │   ├── CreateProjectModal.tsx  # Project creation modal
│   │   └── CreateChatModal.tsx     # Chat creation modal
│   ├── MainContent.tsx             # Dashboard main content area
│   ├── ResizableSidebar.tsx        # Main sidebar container
│   ├── SidebarHeader.tsx           # Sidebar header with app title and actions
│   ├── ResizeHandle.tsx            # Drag handle for sidebar resizing
│   └── ProjectTreeView.tsx         # Project and chat tree navigation
├── hooks/
│   ├── useResizableSidebar.ts      # Sidebar resize logic and state
│   └── useDashboard.ts             # Dashboard state management
└── pages/
    └── Dashboard.tsx               # Main dashboard page (refactored)
```

## Component Responsibilities

### Dashboard Components

#### `Dashboard.tsx`
- **Purpose**: Main dashboard page orchestrator
- **Responsibilities**: 
  - Combines sidebar, main content, and modals
  - Handles global resize state for cursor changes
  - Minimal logic, mostly composition

#### `ResizableSidebar.tsx`
- **Purpose**: Container for the resizable sidebar
- **Responsibilities**:
  - Manages sidebar width and resize functionality
  - Contains header, navigation, and resize handle
  - Uses `useResizableSidebar` hook for logic

#### `SidebarHeader.tsx`
- **Purpose**: Top section of sidebar
- **Responsibilities**:
  - App branding (ZChat title)
  - User information display
  - Action buttons (Settings, Sign Out, Theme Toggle)

#### `MainContent.tsx`
- **Purpose**: Main dashboard content area
- **Responsibilities**:
  - Shows welcome message when no project selected
  - Shows project-specific content when project selected
  - Contains action buttons for creating projects/chats

#### `ResizeHandle.tsx`
- **Purpose**: Interactive resize control
- **Responsibilities**:
  - Visual feedback for resize capability
  - Drag interaction handling
  - Hover and active states

### Modal Components

#### `CreateProjectModal.tsx`
- **Purpose**: Project creation interface
- **Responsibilities**:
  - Form validation and submission
  - Loading states
  - Error handling

#### `CreateChatModal.tsx`
- **Purpose**: Chat creation interface
- **Responsibilities**:
  - Chat title input
  - AI model selection
  - Form validation and submission

## Custom Hooks

### `useResizableSidebar`
- **Purpose**: Encapsulates sidebar resize logic
- **Features**:
  - Width state management
  - Mouse event handling
  - localStorage persistence
  - Configurable min/max widths

### `useDashboard`
- **Purpose**: Manages dashboard state and actions
- **Features**:
  - Project selection logic
  - Modal state management
  - Navigation handling
  - CRUD operations coordination

## Benefits of This Architecture

### 🧩 **Modularity**
- Each component has a single, clear responsibility
- Easy to test components in isolation
- Reusable components across different parts of the app

### 🔧 **Maintainability**
- Logic is separated into custom hooks
- Components are focused on presentation
- Clear separation of concerns

### 📚 **Readability**
- Smaller, focused files are easier to understand
- Self-documenting component names
- Clear prop interfaces

### 🚀 **Performance**
- Components can be optimized individually
- Better tree-shaking potential
- Easier to implement lazy loading

### 🧪 **Testability**
- Hooks can be tested independently
- Components have minimal logic
- Clear input/output interfaces

## Usage Examples

### Adding a new modal
1. Create component in `src/components/modals/`
2. Add state management to `useDashboard` hook
3. Include in `Dashboard.tsx` render

### Customizing sidebar behavior
- Modify `useResizableSidebar` hook configuration
- Adjust min/max widths, storage key, etc.
- Changes automatically apply to all consumers

### Adding new dashboard sections
- Create new component in `src/components/`
- Add to `MainContent.tsx` or create new main section
- Update `useDashboard` if state management needed