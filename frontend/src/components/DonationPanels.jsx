import Modal from '../schedule/Modal.jsx'
import './DonationPanels.css'

const PANELES = [
  {
    tipo: 'insumos',
    titulo: 'Donar insumos',
    resumen: 'Alimento, higiene, salud, limpieza y accesorios para los animales del refugio.',
    puntos: [
      'La entrega es presencial y requiere agendar una hora.',
      'La hora se acuerda con los voluntarios que estén disponibles.',
      'Tu donación queda pendiente hasta que un voluntario la agende contigo y la confirme al recibir los insumos.',
    ],
  },
  {
    tipo: 'monetaria',
    titulo: 'Donar dinero',
    resumen: 'Tu aporte ayuda al cuidado de los animales del refugio.',
    puntos: [
      'Solo se aceptan donaciones monetarias por transferencia, realizadas a los voluntarios.',
      'Un voluntario confirmará la recepción de tu transferencia.',
      'Tu donación queda pendiente hasta esa confirmación.',
    ],
  },
]

// onContinuar recibe el tipo elegido ('insumos' o 'monetaria')
export default function DonationPanels({ onContinuar, onClose }) {
  return (
    <Modal title="¿Cómo quieres ayudar?" onClose={onClose} className="modal--wide">
      <div className="donation-panels">
        {PANELES.map((panel) => (
          <section
            className="donation-panel"
            key={panel.tipo}
            aria-labelledby={`panel-${panel.tipo}`}
          >
            <h3 id={`panel-${panel.tipo}`}>{panel.titulo}</h3>
            <p className="donation-panel__resumen">{panel.resumen}</p>
            <ul>
              {panel.puntos.map((punto) => (
                <li key={punto}>{punto}</li>
              ))}
            </ul>
            <button
              type="button"
              className="donation-panel__continuar"
              onClick={() => onContinuar(panel.tipo)}
            >
              Continuar
            </button>
          </section>
        ))}
      </div>
    </Modal>
  )
}