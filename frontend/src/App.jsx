import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Context providers and pages are wired in later phases.
// Planned shape (see MEMORY.md §8 for full route table):
//
//   <AuthProvider>
//     <NotificationProvider>
//       <CartProvider>
//         <BrowserRouter>
//           <Routes>
//             <Route path="/" element={<Home />} />
//             <Route path="/events" element={<AllEvents />} />
//             ...
//             <Route element={<AuthGuard />}>
//               <Route element={<RoleGuard allow={['organizer']} />}>
//                 <Route path="/organizer" element={<OrganizerDashboard />} />
//               </Route>
//             </Route>
//           </Routes>
//         </BrowserRouter>
//       </CartProvider>
//     </NotificationProvider>
//   </AuthProvider>

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Phase 0 scaffold — see CLAUDE.md + MEMORY.md.</div>} />
      </Routes>
    </BrowserRouter>
  );
}
