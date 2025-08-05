// History.tsx (Updated)
import React, { useState, useEffect, ReactNode } from 'react';
import {
  IonPage, IonHeader, IonToolbar, IonContent,
  IonList, IonItem, IonLabel, IonAvatar, IonIcon,
  IonButtons, IonButton, useIonToast, IonModal,
  IonImg, IonText, IonActionSheet, IonAlert,
  IonInput,
  IonTitle,
  IonFab,
  IonFabButton,
  IonSpinner
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { useHistory, useLocation } from 'react-router-dom';
import {
  time, close, trash, happy, happyOutline, sad, thunderstorm, rainy,
  partlySunny, sunny, cloudy, alertCircle, skull, fitness, cafe, airplane, school,
  medkit, wine, bed, flash, heart, mic, videocam, image, ellipsisVertical, create,
  timeOutline,
  search
} from 'ionicons/icons';
import { searchEntries } from '../services/ai/search';
import Summary from '../services/ai/summary';

interface JournalEntry {
  articleHeadline?: ReactNode;
  id: string;
  content: string;
  createdAt: string;
  mood?: string;
  audio?: string | null;
  images?: string[];
  videos?: string[];
  reminderTime?: string;
  sourceIcon?: string;
  title?: string;
  sourceInfo?: string;
  author?: string;
}

interface MoodOption {
  value: string;
  label: string;
  icon: string;
  category: string;
}

const moodOptions: MoodOption[] = [
  { value: 'happy', label: 'Happy', icon: happy, category: 'positive' },
  { value: 'excited', label: 'Excited', icon: flash, category: 'positive' },
  { value: 'grateful', label: 'Grateful', icon: heart, category: 'positive' },
  { value: 'optimistic', label: 'Optimistic', icon: sunny, category: 'positive' },
  { value: 'energetic', label: 'Energetic', icon: fitness, category: 'positive' },
  { value: 'neutral', label: 'Neutral', icon: happyOutline, category: 'neutral' },
  { value: 'tired', label: 'Tired', icon: bed, category: 'neutral' },
  { value: 'bored', label: 'Bored', icon: time, category: 'neutral' },
  { value: 'focused', label: 'Focused', icon: school, category: 'neutral' },
  { value: 'relaxed', label: 'Relaxed', icon: cafe, category: 'neutral' },
  { value: 'sad', label: 'Sad', icon: sad, category: 'negative' },
  { value: 'angry', label: 'Angry', icon: thunderstorm, category: 'negative' },
  { value: 'anxious', label: 'Anxious', icon: alertCircle, category: 'negative' },
  { value: 'stressed', label: 'Stressed', icon: rainy, category: 'negative' },
  { value: 'depressed', label: 'Depressed', icon: skull, category: 'negative' }
];

const moodColorMap: Record<string, string> = {
  happy: '#FFCC4D',
  excited: '#39c7a8ff',
  grateful: '#c90f3eff',
  optimistic: '#FFD83D',
  energetic: '#63b91cff',
  neutral: '#e0c00bff',
  tired: '#2171bdff',
  bored: '#14ca75ff',
  focused: '#7c7c7cff',
  relaxed: '#ffffffff',
  sad: '#f1d327ff',
  angry: '#FF3B30',
  anxious: '#AF52DE',
  stressed: '#FF2D55',
  depressed: '#5856D6',
};

const History: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [present] = useIonToast();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryEntries, setSummaryEntries] = useState<JournalEntry[]>([]);

  const history = useHistory();
  interface LocationState {
    selectedEntry?: JournalEntry;
    showActionSheet?: boolean;
  }

  const location = useLocation<LocationState>();

  useEffect(() => {
    const loadEntries = async () => {
      const { value } = await Preferences.get({ key: 'journalEntries' });
      if (value && typeof value === 'string') {
        setEntries(JSON.parse(value));
      } else if (value) {
        console.warn('journalEntries preference value is not a string, clearing:', value);
        await Preferences.remove({ key: 'journalEntries' });
        setEntries([]);
      }

      if (location.state?.selectedEntry) {
        setSelectedEntry(location.state.selectedEntry);
        if (location.state.showActionSheet) {
          setTimeout(() => {
            setShowActionSheet(true);
          }, 100);
        }
      }
    };
    loadEntries();
  }, [location.state]);

  const deleteEntry = async (id: string) => {
    try {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      await Preferences.set({
        key: 'journalEntries',
        value: JSON.stringify(updatedEntries)
      });

      setEntries(updatedEntries);

      if (selectedEntry?.id === id) {
        setSelectedEntry(null);
      }

      await present({
        message: 'Entry deleted',
        duration: 2000,
        color: 'danger'
      });

      history.replace('/history');
    } catch (error) {
      present({
        message: 'Failed to delete entry',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  const handleDeleteConfirmed = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      setShowDeleteAlert(false);
      setShowActionSheet(false);
    }
  };

  const openOptionsForSelectedEntry = () => {
    setShowActionSheet(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodIcon = (mood?: string) => {
    if (!mood) return happy;
    return moodOptions.find(m => m.value === mood)?.icon || happy;
  };

  const getMoodColor = (mood?: string) => {
    if (!mood) return moodColorMap['neutral'];
    return moodColorMap[mood] || moodColorMap['neutral'];
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchEntries(searchQuery, entries);
      setSearchResults(results);
    } catch (err) {
      present({
        message: 'Search failed',
        duration: 2000,
        color: 'danger'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const showOnThisDaySummary = async () => {
    const today = new Date();
    const todayEntries = entries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate.getMonth() === today.getMonth() &&
             entryDate.getDate() === today.getDate();
    });
  
    if (todayEntries.length === 0) {
      await present({
        message: "No past entries for today. Check back next year!",
        duration: 2000,
        position: 'top'
      });
    } else {
      setSummaryEntries(todayEntries);
      setShowSummary(true);
    }
  };

  return (
    <IonPage>
      <div style={{ padding: '0 16px' }}>
        <IonItem
          lines="none"
          style={{
            '--background': 'rgba(255, 255, 255, 0.15)',
            '--border-radius': '50px',
            '--padding-start': '16px',
            '--padding-end': '8px',
            '--min-height': '56px',
            'backdrop-filter': 'blur(12px)',
            'box-shadow': '0 4px 16px rgba(0, 0, 0, 0.1)',
            'margin-bottom': '16px',
            'transition': 'all 0.3s ease'
          }}
        >
          <IonInput
            value={searchQuery}
            placeholder="Search memories..."
            onIonChange={e => setSearchQuery(e.detail.value!)}
            onKeyUp={e => e.key === 'Enter' && handleSearch()}
            style={{
              '--padding-top': '12px',
              '--padding-bottom': '12px',
              '--placeholder-color': 'var(--ion-color-medium)',
              '--placeholder-opacity': '0.8',
              '--color': 'var(--ion-color-dark)'
            }}
          />
          <IonButton
            slot="end"
            onClick={handleSearch}
            disabled={isSearching}
            fill="clear"
            style={{
              '--border-radius': '50%',
              '--padding-start': '24px',
              '--padding-end': '0',
              'width': '50px',
              'height': '50px',
              'margin-right': '8px',
              'transition': 'all 0.3s ease',
              '--background-hover': 'rgba(var(--ion-color-primary-rgb), 0.1)'
            }}
          >
            {isSearching ? (
              <IonSpinner
                name="crescent"
                style={{
                  'width': '24px',
                  'height': '24px',
                  'color': 'var(--ion-color-primary)'
                }}
              />
            ) : (
              <IonIcon
                icon={search}
                style={{
                  'font-size': '20px',
                  'color': 'var(--ion-color-primary)'
                }}
              />
            )}
          </IonButton>
        </IonItem>
      </div>

      {searchResults.length > 0 && (
        <IonText style={{ marginBottom: '16px' }}>
          <div style={{ padding: '0 16px' }}>
            <h3>Search Results:</h3>
          </div>
        </IonText>
      )}

      <IonHeader style={{
        background: 'transparent',
        boxShadow: 'none',
        margin: '16px 16px 0 16px'
      }}>
        <IonToolbar style={{
          '--background': 'transparent',
          '--border-width': '0',
          padding: '0'
        }}>
          <IonText
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: 'var(--ion-color-dark)'
            }}
          >
            Recent
          </IonText>

          <IonButtons slot="end">
            <IonButton
              onClick={() => history.push('/home')}
              style={{
                '--background': 'transparent',
                '--background-hover': 'rgba(255,255,255,0.1)',
                margin: '0'
              }}
            >
              <IonIcon
                icon={close}
                style={{
                  color: 'var(--ion-color-primary)',
                  fontSize: '24px',
                  marginRight: '24px'
                }}
              />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--padding-top': '16px',
        '--padding-bottom': '16px',
        '--padding-start': '16px',
        '--padding-end': '16px'
      }}>
        {entries.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '50vh',
            opacity: 0.5,
            textAlign: 'center'
          }}>
            <img
              src="list1.png"
              alt="No entries"
              style={{
                width: '190px',
                height: '190px',
                marginBottom: '16px'
              }}
            />
            <p style={{
              color: 'var(--ion-color-medium)',
              fontSize: '0.9rem',
              margin: '8px 0 0 0'
            }}>
              No entries found. Start a new entry from the home screen.
            </p>
          </div>
        ) : (
          <IonList lines="none" style={{ background: 'transparent' }}>
            {(searchResults.length > 0 ? searchResults : entries).map(entry => (
              <IonItem
                key={entry.id}
                button
                onClick={() => setSelectedEntry(entry)}
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
                    icon={getMoodIcon(entry.mood)}
                    style={{
                      fontSize: '1.2rem',
                      color: getMoodColor(entry.mood)
                    }}
                  />
                </IonAvatar>
                <IonLabel>
                  <h3>{formatDate(entry.createdAt)}</h3>
                  <p>{entry.content.substring(0, 60)}{entry.content.length > 60 ? '...' : ''}</p>
                </IonLabel>
                <IonButton
                  fill="clear"
                  slot="end"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(entry);
                    setTimeout(() => {
                      setShowActionSheet(true);
                    }, 100);
                  }}
                >
                  <IonIcon icon={ellipsisVertical} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <div
          style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '0 20px 30px 20px',
          zIndex: 1000,
          }}
        >
          <IonButton
            expand="block"
            onClick={showOnThisDaySummary}
            style={{
              '--border-radius': '50px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IonIcon icon={timeOutline} style={{ marginRight: '8px', color:'white' }} />
              <div style={{color:'white'}}>
                reflections
              </div>
          </IonButton>
        </div>


        {/* Entry Detail Modal */}
        <IonModal
          isOpen={!!selectedEntry}
          onDidDismiss={() => {
            setSelectedEntry(null);
            setShowActionSheet(false);
          }}
          style={{
            '--width': '100%',
            '--height': '100%',
            '--border-radius': '0'
          }}
        >
          <IonHeader style={{
            background: 'transparent',
            boxShadow: 'none',
            margin: '16px 16px 0 16px'
          }}>
            <IonToolbar style={{
              '--background': 'transparent',
              '--border-width': '0',
              padding: '0'
            }}>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => {
                    setSelectedEntry(null);
                  }}
                  style={{
                    '--background': 'transparent',
                    '--background-hover': 'rgba(255,255,255,0.1)',
                    margin: '0'
                  }}
                >
                  <IonIcon
                    icon={close}
                    style={{
                      color: 'var(--ion-color-primary)',
                      fontSize: '24px',
                      marginRight: '24px'
                    }}
                  />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{
            '--padding-top': '16px',
            '--padding-bottom': '16px',
            '--padding-start': '16px',
            '--padding-end': '16px',
            background: 'var(--ion-color-light)',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            margin: '10px'
          }}>
            {selectedEntry && (
              <div style={{ padding: '20px' }}>
                <div style={{
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--ion-color-light-shade)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <IonAvatar
                      style={{
                        width: '50px',
                        height: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '2px',
                      }}
                    >
                      <IonIcon
                        icon={getMoodIcon(selectedEntry.mood)}
                        style={{
                          fontSize: '1.8rem',
                          color: getMoodColor(selectedEntry.mood)
                        }}
                      />
                    </IonAvatar>
                    <div>
                      <h2 style={{
                        fontSize: '1.4rem',
                        margin: '0 0 4px 0',
                        fontWeight: '600',
                        color: 'var(--ion-color-dark)'
                      }}>
                        {formatDate(selectedEntry.createdAt)}
                      </h2>
                      <IonText color="medium">
                        <p style={{ margin: '0', fontSize: '0.9rem' }}>
                          {selectedEntry.mood ? `Feeling ${selectedEntry.mood}` : 'No mood selected'}
                        </p>
                      </IonText>
                    </div>
                  </div>
                  <IonButton
                    onClick={openOptionsForSelectedEntry}
                    fill="clear"
                  >
                    <IonIcon
                      icon={ellipsisVertical}
                      style={{
                        color: 'var(--ion-color-primary)',
                        fontSize: '24px',
                      }}
                    />
                  </IonButton>
                </div>

                {/* Images Section */}
                {selectedEntry.images && selectedEntry.images.length > 0 && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '0',
                    background: 'transparent',
                    borderRadius: '0',
                    boxShadow: 'none',
                  }}>
                    <IonText>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--ion-color-dark)',
                        display: selectedEntry.images.length > 1 ? 'block' : 'none'
                      }}>
                        <IonIcon icon={image} style={{ verticalAlign: 'middle', marginRight: '5px', color: 'var(--ion-color-secondary)' }} /> Images:
                      </h3>
                    </IonText>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '15px',
                    }}>
                      {selectedEntry.images.map((img, index) => (
                        <IonImg
                          key={index}
                          src={img}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '400px',
                            objectFit: 'cover',
                            borderRadius: '20px',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Content Section */}
                <div style={{ padding: '16px 0' }}>
                  <IonText>
                    <h3 style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      color: 'var(--ion-color-dark)'
                    }}>
                      {selectedEntry.articleHeadline}
                    </h3>
                    <p style={{
                      fontSize: '1.1rem',
                      lineHeight: '1.6',
                      color: 'var(--ion-color-medium-shade)',
                      whiteSpace: 'pre-wrap',
                      marginBottom: '20px',
                    }}>
                      {selectedEntry.content}
                    </p>
                  </IonText>
                </div>

                {/* Audio Section */}
                {selectedEntry.audio && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '15px',
                    background: 'transparent',
                    borderRadius: '12px',
                    boxShadow: 'none',
                  }}>
                    <IonText>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--ion-color-dark)'
                      }}>
                        <IonIcon icon={mic} style={{ verticalAlign: 'middle', marginRight: '5px', color: 'var(--ion-color-tertiary)' }} /> Audio:
                      </h3>
                    </IonText>
                    <audio controls src={selectedEntry.audio} style={{ width: '100%', borderRadius: '8px', outline: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }} />
                  </div>
                )}

                {/* Video Section */}
                {selectedEntry.videos && selectedEntry.videos.length > 0 && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '15px',
                    background: 'transparent',
                    borderRadius: '12px',
                    boxShadow: 'none',
                  }}>
                    <IonText>
                      <h3 style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        marginBottom: '10px',
                        color: 'var(--ion-color-dark)'
                      }}>
                        <IonIcon icon={videocam} style={{ verticalAlign: 'middle', marginRight: '5px', color: 'var(--ion-color-primary)' }} /> Videos:
                      </h3>
                    </IonText>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr',
                      gap: '10px',
                    }}>
                      {selectedEntry.videos.map((vid, index) => (
                        <video
                          key={index}
                          src={vid}
                          controls
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '300px',
                            objectFit: 'cover',
                            borderRadius: '10px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Summary Modal */}
        <IonModal
          isOpen={showSummary}
          onDidDismiss={() => setShowSummary(false)}
          style={{
            '--width': '100%',
            '--height': '100%',
            '--border-radius': '0'
          }}
        >
          <IonHeader style={{
            background: 'transparent',
            boxShadow: 'none',
            margin: '16px 16px 0 16px'
          }}>
            <IonToolbar style={{
              '--background': 'transparent',
              '--border-width': '0',
              padding: '0'
            }}>
              <IonText
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: 'var(--ion-color-dark)'
                }}
              >
                Journals
              </IonText>

              <IonButtons slot="end">
                <IonButton
                  onClick={() => setShowSummary(false)}
                  style={{
                    '--background': 'transparent',
                    '--background-hover': 'rgba(255,255,255,0.1)',
                    margin: '0'
                  }}
                >
                  <IonIcon
                    icon={close}
                    style={{
                      color: 'var(--ion-color-primary)',
                      fontSize: '24px',
                      marginRight: '24px'
                    }}
                  />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

<IonContent style={{
  '--padding-top': '16px',
  '--padding-bottom': '16px',
  '--padding-start': '16px',
  '--padding-end': '16px'
}}>
  {summaryEntries.length > 0 ? (
    <>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginBottom: '24px',
        textAlign: 'center'
      }}>
        <img
          src="reflections.png"
          alt="Reflection time"
          style={{
            width: '180px',
            height: '180px',
            marginBottom: '16px'
          }}
        />
        <IonText style={{ 
          maxWidth: '400px',
          marginBottom: '16px'
        }}>
          <p style={{
            color: 'var(--ion-color-medium)',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            margin: 0
          }}>
            Looking back helps us grow forward. These moments from your past show how far you've come - 
            each entry a stepping stone in your journey.
          </p>
        </IonText>
      </div>
      <Summary entries={summaryEntries} />
    </>
  ) : (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '50vh',
      opacity: 0.5,
      textAlign: 'center'
    }}>
      <img
        src="list1.png"
        alt="No entries"
        style={{
          width: '190px',
          height: '190px',
          marginBottom: '16px'
        }}
      />
      <p style={{
        color: 'var(--ion-color-medium)',
        fontSize: '0.9rem',
        margin: '8px 0 0 0'
      }}>
        No past entries for today. Check back next year!
      </p>
    </div>
  )}
</IonContent>
        </IonModal>

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={[
            {
              text: 'Delete',
              icon: trash,
              role: 'destructive',
              cssClass: 'action-sheet-destructive',
              handler: () => {
                setEntryToDelete(selectedEntry?.id || null);
                setShowDeleteAlert(true);
              }
            },
            {
              text: 'Cancel',
              icon: close,
              role: 'cancel',
              cssClass: 'action-sheet-cancel'
            }
          ]}
          style={{
            '--backdrop-opacity': '0.4',
            '--button-background': 'var(--ion-color-light)',
            '--button-color': 'var(--ion-color-dark)',
            '--button-background-activated': 'var(--ion-color-light-shade)',
            '--button-background-selected': 'var(--ion-color-light-shade)',
          }}
          cssClass="custom-action-sheet"
        />

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Confirm Delete'}
          message={'Are you sure you want to delete this entry? This action cannot be undone.'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowDeleteAlert(false)
            },
            {
              text: 'Delete',
              handler: handleDeleteConfirmed
            }
          ]}
        />

        <style>{`
          .custom-action-sheet {
            --width: 100%;
            --max-width: 400px;
            --height: auto;
          }

          .custom-action-sheet .action-sheet-group {
            overflow: hidden;
            margin: 0 auto;
            width: 100%;
            max-width: 400px;
            border-radius: 0 !important;
          }

          .custom-action-sheet .action-sheet-group:last-of-type {
            border-radius: 0 !important;
          }

          .action-sheet-button {
            --background: var(--ion-color-light);
            --color: var(--ion-color-dark);
            --background-activated: var(--ion-color-light-shade);
            --background-hover: var(--ion-color-light-shade);
            border-bottom: 1px solid var(--ion-color-light-shade);
            margin: 0;
          }

          .action-sheet-destructive {
            --background: var(--ion-color-light);
            --color: var(--ion-color-danger);
            --background-activated: var(--ion-color-light-shade);
            border-bottom: 1px solid var(--ion-color-light-shade);
            margin: 0;
            border-top-left-radius: 16px;
            border-top-right-radius: 16px;
          }

          .action-sheet-cancel {
            --background: var(--ion-color-light);
            --color: var(--ion-color-dark);
            border-radius: 0 !important;
            margin: 0;
          }

          .custom-action-sheet .action-sheet-cancel {
            border-radius: 0 !important;
          }
        `}</style>
      </IonContent>
    </IonPage>
  );
};

export default History;
