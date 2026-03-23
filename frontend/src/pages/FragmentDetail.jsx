// #genai
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api'
import './FragmentDetail.css'

export default function FragmentDetail() {
  const { id } = useParams()
  const [fragment, setFragment] = useState(null)

  useEffect(() => {
    api.getFragment(id).then(setFragment)
  }, [id])

  if (!fragment) return <div className="loading">Loading...</div>

  return (
    <article className="fragment-detail">
      <Link to="/fragments" className="back-link">&larr; back to fragments</Link>

      {fragment.image && (
        <div className="fd-image">
          <img src={api.imageUrl(fragment.image)} alt="" />
        </div>
      )}

      <blockquote className="fd-text">
        {fragment.text}
      </blockquote>
    </article>
  )
}
