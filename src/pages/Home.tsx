// Home.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonTextarea, IonList,
  IonItem, IonLabel, IonAvatar, IonFab, IonFabButton,
  IonModal, IonSelect, IonSelectOption, useIonToast,
  IonAlert,
  IonInput,
  IonText,
  IonImg,
} from '@ionic/react';
import {
  person, time, add, close,
  trash, create, ellipsisVertical, happy, sad, happyOutline, sadOutline,
  heart, heartOutline, thunderstorm, rainy,
  partlySunny, sunny, cloudy, alertCircle,
  skull, fitness, cafe, airplane, school,
  medkit, wine, bed, flash, mic, micOff, image, attach, videocam,
  calendar, timer, bookmark, colorPalette
} from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { useIonViewWillEnter } from '@ionic/react';
import { analyzeSentiment, extractKeywords } from '../services/ai/sentiment';
import { transcribeVoice } from '../services/ai/voice';

interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
  mood?: string;
  audio?: string | null;
  images?: string[];
  videos?: string[];
  reminderTime?: string;
}

interface UserData {
  email: string;
  name?: string;
  fullNames?: string;
  surname?: string;
  avatar?: string;
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
  energetic: '#0011ffff',
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

const prompts = [
  "What's on your mind today?",
  "Ready to make today count?",
  "Any thoughts you'd like to share?",
  "Breathe in… How's your mood?",
  "Start with a feeling—how are you doing?",
  "Need to get something off your chest?",
  "What kind of day are you having?",
  "Feeling okay today?",
  "Is there a moment you want to capture?",
  "Tell me something small or big.",
  "How's your energy right now?",
  "Take a moment. What's inside your head?",
  "Today's story starts with you.",
  "Name one thing you're grateful for."
];

const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

const Home: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [present] = useIonToast();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const history = useHistory();
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState<string>('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionError, setTranscriptionError] = useState('');

  const getMoodCategory = (category: string): MoodOption[] => {
    return moodOptions.filter(mood => mood.category === category);
  };

  const getMoodIcon = (mood?: string) => {
    if (!mood) return happy;
    return moodOptions.find(m => m.value === mood)?.icon || happy;
  };

  const getMoodColor = (mood?: string) => {
    if (!mood) return moodColorMap['neutral'];
    return moodColorMap[mood] || moodColorMap['neutral'];
  };

  const loadData = async () => {
    try {
      const { value: entriesValue } = await Preferences.get({ key: 'journalEntries' });
      if (entriesValue && typeof entriesValue === 'string') {
        setEntries(JSON.parse(entriesValue));
      } else if (entriesValue) {
        console.warn('journalEntries preference value is not a string, clearing:', entriesValue);
        await Preferences.remove({ key: 'journalEntries' });
        setEntries([]);
      }

      const { value: authValue } = await Preferences.get({ key: 'userAuth' });
      if (!authValue) return;

      let authData: UserData | null = null;
      if (typeof authValue === 'string') {
        try {
          authData = JSON.parse(authValue);
        } catch (e) {
          console.error('Error parsing userAuth, clearing:', e, authValue);
          await Preferences.remove({ key: 'userAuth' });
          return;
        }
      } else {
        console.warn('userAuth preference value is not a string, clearing:', authValue);
        await Preferences.remove({ key: 'userAuth' });
        return;
      }

      if (!authData) return;

      let completeUserData: UserData = { ...authData };

      if (authData.email) {
        const { value: detailedValue } = await Preferences.get({ key: `user-${authData.email}` });
        if (detailedValue && typeof detailedValue === 'string') {
          try {
            const detailedData: UserData = JSON.parse(detailedValue);
            completeUserData = {
              ...completeUserData,
              ...detailedData,
              name: completeUserData.name || `${detailedData.fullNames || ''} ${detailedData.surname || ''}`.trim()
            };
          } catch (e) {
            console.error(`Error parsing user-${authData.email}, clearing:`, e, detailedValue);
            await Preferences.remove({ key: `user-${authData.email}` });
          }
        } else if (detailedValue) {
          console.warn(`user-${authData.email} preference value is not a string, clearing:`, detailedValue);
          await Preferences.remove({ key: `user-${authData.email}` });
        }
      }

      const { value: avatarValue } = await Preferences.get({ key: 'userAvatar' });
      if (avatarValue) {
        completeUserData.avatar = avatarValue;
      }

      setUser(completeUserData);
    } catch (error) {
      console.error('Error loading data:', error);
      present({
        message: 'Error loading user data',
        duration: 2000,
        color: 'danger'
      });
    }
  };

  useIonViewWillEnter(() => {
    loadData();
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages = files.map(file => URL.createObjectURL(file));
      setImages([...images, ...newImages]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newVideos = files.map(file => URL.createObjectURL(file));
      setVideos([...videos, ...newVideos]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages(images.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveVideo = (indexToRemove: number) => {
    setVideos(videos.filter((_, index) => index !== indexToRemove));
  };

  const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];
    setIsRecording(true);
    
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioBlobUrl(audioUrl);
      
      // Transcribe the audio
      setIsTranscribing(true);
      try {
        const transcript = await transcribeVoice(audioBlob);
        if (transcript) {
          setNewEntry(prev => prev ? `${prev} ${transcript}` : transcript);
          
          // Analyze sentiment
          const sentimentResult = await analyzeSentiment(transcript);
          setSelectedMood(sentimentResult.label);
          
          // Extract keywords
          const keywords = extractKeywords(transcript);
          // You can store these keywords with the entry
        }
      } catch (err) {
        setTranscriptionError('Failed to transcribe audio');
      } finally {
        setIsTranscribing(false);
      }
      
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorderRef.current.start();
  } catch (err) {
    console.error('Error accessing microphone:', err);
    present({ message: 'Failed to start recording.', duration: 2000, color: 'danger' });
  }
};


  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      present({ message: 'Recording stopped.', duration: 1500, color: 'success' });
    }
  };

  const handleSave = async () => {
    if (!newEntry.trim()) {
      present({
        message: 'Please write something first',
        duration: 2000,
        color: 'warning'
      });
      return;
    }

    const entry: JournalEntry = {
      id: entryToEdit?.id || Date.now().toString(),
      content: newEntry,
      createdAt: entryToEdit?.createdAt || new Date().toISOString(),
      mood: selectedMood,
      audio: audioBlobUrl,
      images,
      videos,
      reminderTime
    };

    let updatedEntries;
    if (entryToEdit) {
      updatedEntries = entries.map(e => e.id === entry.id ? entry : e);
    } else {
      updatedEntries = [entry, ...entries];
    }

    await saveEntries(updatedEntries);
    setNewEntry('');
    setSelectedMood('');
    setShowEntryModal(false);
    setAudioBlobUrl(null);
    setImages([]);
    setVideos([]);
    setReminderTime('');
    setEntryToEdit(null);

    present({
      message: entryToEdit ? 'Entry updated successfully' : 'Entry saved successfully',
      duration: 2000,
      color: 'success'
    });
  };

  const saveEntries = async (entries: JournalEntry[]) => {
    await Preferences.set({
      key: 'journalEntries',
      value: JSON.stringify(entries)
    });
    setEntries(entries);
  };

  return (
    <IonPage>
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
              onClick={() => history.push('/profile')}
              style={{
                '--background': 'transparent',
                '--background-hover': 'rgba(255,255,255,0.1)',
                margin: '0'
              }}
            >
              {user?.avatar ? (
                <IonAvatar style={{
                  width: '42px',
                  height: '42px',
                  marginRight: '24px',
                  marginBottom: '16px'
                }}>
                  <IonImg
                    src={user.avatar}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </IonAvatar>
              ) : (
                <IonIcon
                  icon={person}
                  style={{
                    fontSize: '24px',
                    marginRight: '24px',
                    marginBottom: '16px'
                  }}
                />
              )}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{
        '--padding-top': '16px',
        '--padding-bottom': '16px',
        '--padding-start': '16px',
        '--padding-end': '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          marginBottom: '2rem',
          marginTop: '8px'
        }}>
          <h2 style={{
            fontSize: '1.8rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            marginLeft: '4px'
          }}>
            Good {getTimeOfDay()}, {user?.name || `${user?.fullNames || ''} ${user?.surname || ''}`.trim() || 'User'}.
          </h2>
          <p style={{
            color: 'var(--ion-color-medium)',
            margin: '0 0 0 4px'
          }}>
            {randomPrompt}
          </p>
        </div>

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
              Tap the + button below to add your first entry.
            </p>
          </div>
        ) : (
          <IonList
            lines="none"
            style={{
              background: 'transparent',
              marginBottom: '1rem',
              marginTop: '8px'
            }}
          >
            {entries.map(entry => (
              <IonItem
                key={entry.id}
                button
                style={{
                  '--border-radius': '25px',
                  '--padding-start': '10px',
                  '--padding-end': '10px',
                  marginBottom: '12px',
                  '--background': 'var(--ion-color-light)'
                }}
                onClick={() => history.push(`/history`, { selectedEntry: entry })}
              >
                <IonAvatar
                  slot="start"
                  style={{
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--ion-color-light-shade)',
                    borderRadius: '50%'
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
                  onClick={e => {
                    e.stopPropagation();
                    history.push('/history', { selectedEntry: entry, showActionSheet: true });
                  }}
                >
                  <IonIcon icon={ellipsisVertical} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          style={{
            marginRight: '16px',
            marginBottom: '16px'
          }}
        >
          <IonFabButton
            onClick={() => setShowEntryModal(true)}
            style={{ '--background': 'var(--ion-color-primary)' }}
          >
            <IonIcon icon={add} style={{ color: 'white' }} />
          </IonFabButton>
        </IonFab>

        {/* New Entry Modal */}
        <IonModal
          isOpen={showEntryModal}
          onDidDismiss={() => {
            setShowEntryModal(false);
            setEntryToEdit(null);
            setNewEntry('');
            setSelectedMood('');
            setAudioBlobUrl(null);
            setImages([]);
            setVideos([]);
            setReminderTime('');
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
              mediaRecorderRef.current.stop();
            }
            setIsRecording(false);
          }}
          style={{
            '--width': '100%',
            '--height': '100%',
            '--border-radius': '0'
          }}
        >
          <IonHeader>
            <IonToolbar style={{
              '--background': 'transparent',
              '--border-width': '0',
              padding: '0'
            }}>
              <IonButtons slot="start">
                <IonButton onClick={() => setShowEntryModal(false)}
                  style={{
                    color: 'var(--ion-color-primary)'
                  }}>
                  <IonIcon icon={close} />
                </IonButton>
              </IonButtons>
              <IonButtons slot="end">
                <IonButton strong onClick={handleSave}>
                  Save
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent style={{
            '--padding-top': '16px',
            '--padding-bottom': '16px',
            '--padding-start': '16px',
            '--padding-end': '16px',
            marginBottom: '16px'
          }}>
            {/* Mood Selection */}
            <div
              style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <IonText style={{
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: 'var(--ion-color-medium)'
              }}>
                How are you feeling?
              </IonText>
              <IonButton
                fill="outline"
                color="primary"
                onClick={() => setShowMoodModal(true)}
                style={{
                  '--border-radius': '12px',
                  '--border-color': 'var(--ion-color-light-shade)',
                  color: 'var(--ion-color-primary)',
                  height: 'auto',
                  padding: '8px 12px',
                  minWidth: '150px'
                }}
              >
                {selectedMood ? (
                  <>
                    <IonIcon
                      icon={getMoodIcon(selectedMood)}
                      slot="start"
                      style={{ fontSize: '1.2rem', color: getMoodColor(selectedMood) }}
                    />
                    {moodOptions.find(m => m.value === selectedMood)?.label}
                  </>
                ) : (
                  <>
                    <IonIcon icon={happyOutline} slot="start" style={{ fontSize: '1.2rem' }} /> Select Mood
                  </>
                )}
              </IonButton>
            </div>

            <IonTextarea
              value={newEntry}
              placeholder="Write your thoughts here..."
              autoGrow
              rows={6}
              onIonChange={e => setNewEntry(e.detail.value!)}
              style={{
                border: '1px solid var(--ion-color-light-shade)',
                borderRadius: '12px',
                padding: '12px',
                marginTop: '1rem',
                marginBottom: '1rem'
              }}
            />

            {/* Media Action Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '1rem'
            }}>
              {/* Audio Recording */}
              <IonButton fill="clear" color="medium" onClick={isRecording ? stopRecording : startRecording}>
                <IonIcon icon={isRecording ? micOff : mic} slot="start" />
                {isRecording ? 'Stop Recording' : 'Record Audio'}
              </IonButton>

              {/* Image Upload */}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                ref={imageInputRef}
                style={{ display: 'none' }}
              />
              <IonButton fill="clear" color="medium" onClick={() => imageInputRef.current?.click()}>
                <IonIcon icon={image} slot="start" />
                Add Image
              </IonButton>

              {/* Video Upload */}
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                ref={videoInputRef}
                style={{ display: 'none' }}
              />
              <IonButton fill="clear" color="medium" onClick={() => videoInputRef.current?.click()}>
                <IonIcon icon={videocam} slot="start" />
                Add Video
              </IonButton>
            </div>

            {/* Audio Preview */}
            {audioBlobUrl && (
              <div style={{
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--ion-color-light-shade)',
                borderRadius: '8px',
                padding: '8px'
              }}>
                <audio controls src={audioBlobUrl} style={{ flexGrow: 1 }} />
                <IonButton fill="clear" color="danger" onClick={() => setAudioBlobUrl(null)}>
                  <IonIcon icon={close} />
                </IonButton>
              </div>
            )}

            {/* Image Preview */}
            {images.length > 0 && (
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '8px',
                marginBottom: '1rem',
                paddingBottom: '8px'
              }}>
                {images.map((img, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    minWidth: '100px',
                    height: '100px'
                  }}>
                    <img
                      src={img}
                      alt={`Attachment ${index}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <IonButton
                      fill="clear"
                      color="danger"
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        '--padding-start': '4px',
                        '--padding-end': '4px'
                      }}
                      onClick={() => handleRemoveImage(index)}
                    >
                      <IonIcon icon={close} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}

            {/* Video Preview */}
            {videos.length > 0 && (
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '8px',
                marginBottom: '1rem',
                paddingBottom: '8px'
              }}>
                {videos.map((vid, index) => (
                  <div key={index} style={{
                    position: 'relative',
                    minWidth: '100px',
                    height: '100px'
                  }}>
                    <video
                      src={vid}
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <IonButton
                      fill="clear"
                      color="danger"
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        '--padding-start': '4px',
                        '--padding-end': '4px'
                      }}
                      onClick={() => handleRemoveVideo(index)}
                    >
                      <IonIcon icon={close} />
                    </IonButton>
                  </div>
                ))}
              </div>
            )}

            {/* Recent Entries Section */}
            {entries.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <IonText>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem',
                    color: 'var(--ion-color-dark)',
                    marginLeft: '4px'
                  }}>
                    Recent Entries:
                  </h3>
                </IonText>
                <IonList
                  lines="none"
                  style={{
                    background: 'transparent',
                    marginBottom: '1rem'
                  }}
                >
                  {entries.map(entry => (
                    <IonItem
                      key={entry.id}
                      button
                      style={{
                        '--border-radius': '25px',
                        '--padding-start': '10px',
                        '--padding-end': '10px',
                        marginBottom: '12px',
                        '--background': 'var(--ion-color-light)'
                      }}
                      onClick={() => history.push(`/history`, { selectedEntry: entry })}
                    >
                      <IonAvatar
                        slot="start"
                        style={{
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--ion-color-light-shade)',
                          borderRadius: '50%'
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
                        onClick={e => {
                          e.stopPropagation();
                          history.push('/history', { selectedEntry: entry, showActionSheet: true });
                        }}
                      >
                        <IonIcon icon={ellipsisVertical} />
                      </IonButton>
                    </IonItem>
                  ))}
                </IonList>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Mood Selection Modal */}
        <IonModal
          isOpen={showMoodModal}
          canDismiss={true}
          onDidDismiss={() => setShowMoodModal(false)}
          initialBreakpoint={0.5}
          breakpoints={[0, 0.5, 1]}
          style={{
            '--width': '100%',
            '--height': '100%',
            '--border-radius': '30px',
          }}
        >
          <IonHeader style={{
            background: 'transparent',
            boxShadow: 'none',
            margin: '10px 10px 0 10px',
          }}>
            <IonToolbar style={{
              '--background': 'transparent',
              '--border-width': '0',
              padding: '0'
            }}>
              <IonTitle>Select Mood</IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => setShowMoodModal(false)}
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
            marginBottom: '16px'
          }}>
            <IonList lines="none" style={{ background: 'transparent' }}>
              {Object.keys(MoodCategory).map(category => (
                <div key={category} style={{ marginBottom: '16px' }}>
                  <IonText color="medium">
                    <h3 style={{ textTransform: 'capitalize', marginBottom: '8px' }}>
                      {category} Moods
                    </h3>
                  </IonText>
                  {getMoodCategory(category).map(mood => (
                    <IonItem
                      key={mood.value}
                      button
                      onClick={() => {
                        setSelectedMood(mood.value);
                        setShowMoodModal(false);
                      }}
                      style={{
                        '--border-radius': '12px',
                        '--background': selectedMood === mood.value ? 'var(--ion-color-primary-tint)' : 'var(--ion-color-light)',
                        color: selectedMood === mood.value ? 'var(--ion-color-primary-contrast)' : 'inherit',
                        marginBottom: '8px',
                        '--padding-start': '10px',
                        '--padding-end': '10px',
                      }}
                    >
                      <IonIcon
                        icon={mood.icon}
                        slot="start"
                        style={{
                          fontSize: '1.2rem',
                          color: moodColorMap[mood.value],
                          filter: mood.category === 'negative'
                            ? 'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'
                            : 'none'
                        }}
                      />
                      <IonLabel>{mood.label}</IonLabel>
                    </IonItem>
                  ))}
                </div>
              ))}
            </IonList>
          </IonContent>
        </IonModal>

        {/* Delete Confirmation Alert */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Delete Entry'}
          message={'Are you sure you want to delete this entry?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              handler: () => {
                // Delete logic would be handled in History.tsx
              }
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
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

enum MoodCategory {
  positive = 'positive',
  neutral = 'neutral',
  negative = 'negative'
}

export default Home;
