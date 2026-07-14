import pazmunLockup from '../assets/pazmun-lockup.png'

export default function Home() {
  return (
    <div className="profile-page">
      <div className="landing">
        <img src={pazmunLockup} alt="PAZMUN 2026" />
        <h1>Escanea tu credencial</h1>
        <p>
          Cada credencial física de PAZMUN 2026 tiene un código QR único. Escanéalo con la
          cámara de tu teléfono para ver tu perfil de participante.
        </p>
      </div>
    </div>
  )
}
