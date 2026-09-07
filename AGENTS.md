# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Dashboard & Staff UI Guidelines
1. **Modern Aesthetics:** When designing dashboards or staff interfaces, avoid rigid, wide, flat blocks. Use modern mobile-first design patterns such as pill-shaped segmented controls, dynamic floating elements, glassmorphism, and smooth animations to make it feel premium.
2. **Real-time Sync:** For any status, queue, or booking management UI, always implement real-time synchronization (e.g., using Supabase Realtime subscriptions `postgres_changes`) so that the UI updates automatically when another user or the system changes the database, eliminating the need for manual refreshes.
