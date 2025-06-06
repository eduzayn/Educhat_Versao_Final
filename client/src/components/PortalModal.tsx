import { createPortal } from 'react-dom';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function PortalModal({ isOpen, onClose, title, children }: PortalModalProps) {
  const portalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Criar elemento portal completamente independente
      const portalElement = document.createElement('div');
      portalElement.style.position = 'fixed';
      portalElement.style.top = '0';
      portalElement.style.left = '0';
      portalElement.style.width = '100%';
      portalElement.style.height = '100%';
      portalElement.style.zIndex = '9999';
      portalElement.style.pointerEvents = 'auto';
      
      document.body.appendChild(portalElement);
      portalRef.current = portalElement;

      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';

      return () => {
        if (portalRef.current) {
          document.body.removeChild(portalRef.current);
          portalRef.current = null;
        }
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  if (!isOpen || !portalRef.current) return null;

  const modalContent = (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          style={{
            padding: '16px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div 
          style={{
            padding: '16px',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 80px)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, portalRef.current);
}