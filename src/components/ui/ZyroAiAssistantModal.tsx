import React, { useState } from 'react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { AI_INSIGHTS_BY_SITE } from '../../data/logisticsData';
import { ViewScope } from '../../types/logistics';

interface ZyroAiAssistantModalProps {
  isOpen: boolean;
  viewScope: ViewScope;
  onClose: () => void;
  onApplyOptimization: () => void;
}

/**
 * Implements Canal Ejecutivo Manual §6.4 (Zyro as onboarding/help mentor)
 * and §8.1–8.3 (IA responsable + Cian Zyro active state + 45° chamfered brand card).
 */
export const ZyroAiAssistantModal: React.FC<ZyroAiAssistantModalProps> = ({
  isOpen,
  viewScope,
  onClose,
  onApplyOptimization,
}) => {
  const [applied, setApplied] = useState(false);

  if (!isOpen) return null;

  const insight = AI_INSIGHTS_BY_SITE[viewScope] || AI_INSIGHTS_BY_SITE['CD-04'];

  return (
    <aside
      className="ce-zyro-panel"
      role="dialog"
      aria-label="Asistente IA y Guía Zyro de Canal Ejecutivo"
    >
      <div className="ce-zyro-panel__header">
        <img
          src="/brand/zyro-avatar.png"
          alt=""
          className="ce-zyro-panel__avatar"
        />
        <div className="ce-zyro-panel__meta">
          <div className="ce-zyro-panel__title-row">
            <strong>Zyro · Guía y Copiloto IA</strong>
            <span className="ce-zyro-online">● IA activa</span>
          </div>
          <span>Canal Ejecutivo · Centro Tecnológico</span>
        </div>
        <button
          type="button"
          className="ce-zyro-panel__close"
          onClick={onClose}
          aria-label="Cerrar asistente"
        >
          <X size={15} />
        </button>
      </div>

      <div className="ce-zyro-panel__body">
        {/* Zyro Onboarding Guide Bubble (tuteo, frases cortas y claras según §6.1) */}
        <div className="ce-zyro-msg">
          <p>
            ¡Hola! Soy <strong>Zyro</strong>. Explora el gemelo digital 3D de{' '}
            <strong>Canal Ejecutivo</strong>:
          </p>
          <ul className="ce-zyro-steps">
            <li>
              <strong>1. Orbita y acerca:</strong> arrastra con el clic izquierdo o usa la rueda del ratón.
            </li>
            <li>
              <strong>2. Cambia de sede:</strong> alterna entre las 5 naves logísticas arriba.
            </li>
            <li>
              <strong>3. Inspecciona en vivo:</strong> haz clic en cualquier camión, montacargas o muelle 3D.
            </li>
          </ul>
        </div>

        {/* Chamfered 45° AI Diagnostic Card (§5.1 + §8.3) */}
        <div className="ce-ai-insight-card">
          <div className="ce-ai-insight-card__top">
            <span className="ce-ai-insight-card__tag">
              <Sparkles size={12} /> DIAGNÓSTICO {viewScope}
            </span>
            <span className="ce-ai-insight-card__gain ce-mono">
              {insight.metricGain}
            </span>
          </div>
          <h4>{insight.title}</h4>
          <p>{insight.recommendation}</p>

          <button
            type="button"
            className="ce-btn-primary ce-btn-primary--sm"
            onClick={() => {
              onApplyOptimization();
              setApplied(true);
              setTimeout(() => setApplied(false), 3000);
            }}
          >
            {applied ? (
              <>
                <CheckCircle2 size={14} /> Optimización aplicada en planta
              </>
            ) : (
              'Aplicar recomendación en simulación'
            )}
          </button>

          <span className="ce-ai-responsible-note">
            Generado con IA · revisado por un experto
          </span>
        </div>
      </div>
    </aside>
  );
};

