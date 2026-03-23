// #genai
import { NavLink } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-links">
        <NavLink to="/" className="nav-link">HOME</NavLink>
        <NavLink to="/writings" className="nav-link">WRITINGS</NavLink>
        <NavLink to="/fragments" className="nav-link">FRAGMENTS</NavLink>
        <NavLink to="/visual-stories" className="nav-link">VISUAL STORIES</NavLink>
        <NavLink to="/about" className="nav-link">ABOUT</NavLink>
      </div>
      <div className="navbar-brand">
        <NavLink to="/">
          <span className="brand-title">Architecture in Fragments</span>
          <span className="brand-subtitle">A SPATIAL JOURNAL</span>
        </NavLink>
      </div>
    </nav>
  )
}
