# Beer Terms Dictionary Project Plan

## Project Overview
A bilingual beer terms dictionary web application featuring Chinese-English term pairs with explanations, organized in a modern three-column layout.

## Core Features

### 1. Term Organization
- **Category-based browsing**: Terms grouped by beer-related categories (e.g., Brewing Process, Ingredients, Styles, Equipment)
- **A-Z alphabetical browsing**: Quick access by first letter
- **Search functionality**: Search across English terms, Chinese terms, and explanations

### 2. Content Structure
Each term entry includes:
- **English Term**: Original beer terminology
- **Chinese Term**: Corresponding Chinese translation
- **Chinese Explanation**: Detailed explanation in Chinese
- **English Explanation**: Detailed explanation in English

### 3. User Interface Design

#### Layout (Three-Column Design)
- **Left Column (Navigation)**: Category menu and A-Z index
- **Middle Column (Main Content)**: Term listings and detailed views
- **Right Column (Tags/Filters)**: Related tags, filters, and quick actions

#### Visual Design
- **Color Scheme**: White and orange theme for modern, clean appearance
- **Typography**: Clear, readable fonts for bilingual content
- **Responsive Design**: Mobile-friendly layout adaptation

## Technical Architecture

### Frontend: Vue 3
- **Framework**: Vue 3 with Composition API
- **Styling**: 
  - CSS framework (Tailwind CSS recommended)
  - Custom orange-white color palette
- **State Management**: Pinia for application state
- **Routing**: Vue Router for navigation
- **Build Tool**: Vite for fast development

### Backend: Supabase
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth (for future admin features)
- **API**: Supabase auto-generated REST API
- **Real-time**: Supabase real-time subscriptions (if needed)

## Database Schema

### Terms Table
```sql
terms {
  id: UUID (Primary Key)
  english_term: TEXT
  chinese_term: TEXT
  chinese_explanation: TEXT
  english_explanation: TEXT
  category_id: UUID (Foreign Key)
  tags: TEXT[]
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

### Categories Table
```sql
categories {
  id: UUID (Primary Key)
  name_en: TEXT
  name_zh: TEXT
  description: TEXT
  sort_order: INTEGER
  created_at: TIMESTAMP
}
```

## Development Phases

### Phase 1: Foundation Setup
- [ ] Initialize Vue 3 project with Vite
- [ ] Set up Supabase project and database
- [ ] Create basic project structure
- [ ] Implement basic routing

### Phase 2: Core UI Components
- [ ] Create three-column layout component
- [ ] Implement category navigation
- [ ] Build term listing component
- [ ] Design term detail view

### Phase 3: Data Integration
- [ ] Set up Supabase client
- [ ] Implement data fetching services
- [ ] Connect UI components to backend
- [ ] Add search functionality

### Phase 4: Content Management
- [ ] Create initial term database
- [ ] Implement A-Z browsing
- [ ] Add filtering and sorting
- [ ] Optimize performance

### Phase 5: Polish & Deployment
- [ ] Responsive design implementation
- [ ] Performance optimization
- [ ] Testing and bug fixes
- [ ] Deployment setup

## Key Dependencies

### Frontend
- Vue 3
- Vue Router
- Pinia
- Tailwind CSS
- Supabase JS Client
- Vite

### Backend
- Supabase (hosted)
- PostgreSQL database

## Future Enhancements
- Admin interface for term management
- User contributions and suggestions
- Advanced search with filters
- Pronunciation guides
- Related terms linking
- Export functionality
- Mobile app version

## Success Metrics
- User-friendly bilingual interface
- Fast search and browsing experience
- Comprehensive beer terminology coverage
- Mobile-responsive design
- Scalable architecture for future growth