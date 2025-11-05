# Implementation Plan

- [x] 1. Add user dropdown menu with logout functionality to MainLayout



  - Replace the existing standalone user profile button with a dropdown menu component
  - Import DropdownMenu components from @/components/ui/dropdown-menu
  - Import LogOut icon from lucide-react
  - Add useNavigate hook from react-router-dom
  - Implement handleLogout function that calls logout() from AuthContext and navigates to /login
  - Create dropdown menu structure with user profile and logout menu items
  - Ensure dropdown aligns to the right edge and includes proper styling
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3_

- [ ]* 2. Test logout functionality
  - Manually verify logout button appears in dropdown menu
  - Test clicking logout button logs out user and redirects to login page
  - Verify authentication tokens are cleared from localStorage
  - Test logout with network issues to ensure local cleanup still occurs
  - Verify toast notification appears on successful logout
  - Test dropdown menu on different screen sizes
  - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3_
