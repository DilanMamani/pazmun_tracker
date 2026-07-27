import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="profile-page">
      <div className="credential-message">
        <h1>Página no encontrada</h1>
        <p>La dirección a la que intentaste llegar no existe.</p>
        <Link to="/" className="staff-entry-link" style={{ display: 'inline-block', marginTop: 14 }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
