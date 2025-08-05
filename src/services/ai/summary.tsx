import React from 'react';
import { 
  IonText,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
  IonLabel,
  IonItem
} from '@ionic/react';
import { JournalEntry } from '../../types';
import { close, timeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

interface SummaryProps {
  entries: JournalEntry[];
}

const Summary: React.FC<SummaryProps> = ({ entries }) => {
  const history = useHistory();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (entries.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        color: 'var(--ion-color-medium)'
      }}>
        <IonText>
          <p>No entries from this day in previous years.</p>
        </IonText>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'grid',
        gap: '12px',
        width: '100%'
      }}>
        {entries.map((entry: JournalEntry, index: number) => (
          <IonItem
            key={index}
            button
            detail={false}
            style={{
              '--border-radius': '50px',
              '--padding-start': '10px',
              '--padding-end': '10px',
              marginBottom: '12px',
              '--background': 'var(--ion-color-light)'
            }}
          >
            <IonAvatar
              slot="start"
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--ion-color-light-shade)'
              }}
            >
              <IonIcon
                icon={timeOutline}
                style={{
                  fontSize: '1.2rem',
                  color: 'var(--ion-color-primary)'
                }}
              />
            </IonAvatar>
            <IonLabel>
              <h3>{formatDate(entry.createdAt)}</h3>
              <p>{entry.content.substring(0, 60)}{entry.content.length > 60 ? '...' : ''}</p>
            </IonLabel>
          </IonItem>
        ))}
      </div>
    </div>
  );
};

export default Summary;
