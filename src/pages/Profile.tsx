import React, { useState, useEffect } from 'react';
import {
  IonPage, IonContent, IonHeader, IonToolbar, IonButtons,
  IonButton, IonIcon, IonList, IonItem, IonLabel,
  IonAvatar, IonCard, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonGrid, IonRow, IonCol, IonAlert,
  useIonToast, IonImg, IonInput, IonToggle, IonText,
  IonModal, IonTextarea, IonTitle
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import {
  lockClosed, settings, helpCircle, person,
  chevronDown, chevronUp, logOut, close, camera,
  save, create, trash, documentText, personCircle, 
  call, mail, home, calendar, briefcase
} from 'ionicons/icons';
import { analyzeEntries } from '../services/ai/storage';
import { JournalEntry } from '../types';

interface UserData {
  email: string;
  name?: string;
  fullNames?: string;
  surname?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  password?: string;
}

interface EditForm {
  name: string;
  phone: string;
  address: string;
  occupation: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface SettingsForm {
  darkMode: boolean;
  notifications: boolean;
  biometricAuth: boolean;
}

interface ContactForm {
  name: string;
  email: string;
  message: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDeleteAvatarAlert, setShowDeleteAvatarAlert] = useState(false);
  const [present] = useIonToast();
  const history = useHistory();
  const [moodData, setMoodData] = useState<any>(null);
  const [privacyEnabled, setPrivacyEnabled] = useState(true);
  const [isLoadingMoodData, setIsLoadingMoodData] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState<EditForm>({
    name: '',
    phone: '',
    address: '',
    occupation: ''
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [settingsForm, setSettingsForm] = useState<SettingsForm>({
    darkMode: false,
    notifications: true,
    biometricAuth: false
  });

  const [contactForm, setContactForm] = useState<ContactForm>({
    name: '',
    email: '',
    message: ''
  });

  const [showContactForm, setShowContactForm] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    const loadMoodData = async () => {
      setIsLoadingMoodData(true);
      try {
        const { value } = await Preferences.get({ key: 'journalEntries' });
        if (value) {
          const entries: JournalEntry[] = JSON.parse(value);
          const { summary } = await analyzeEntries(entries);
          
          const chartData = {
            labels: summary.timeline.map(item => new Date(item.date).toLocaleDateString()),
            datasets: [{
              label: 'Mood Trend',
              data: summary.timeline.map(item => item.mood),
              borderColor: 'var(--ion-color-primary)',
              backgroundColor: 'rgba(var(--ion-color-primary-rgb), 0.1)',
              tension: 0.3,
              fill: true
            }]
          };
          
          setMoodData(chartData);
        }
      } catch (err) {
        console.error('Failed to load mood data:', err);
      } finally {
        setIsLoadingMoodData(false);
      }
    };
    
    loadMoodData();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { value: authValue } = await Preferences.get({ key: 'userAuth' });
        if (!authValue) return;

        const authData: UserData = JSON.parse(authValue);
        const userEmail = authData.email;
        let user: UserData = { ...authData };

        if (userEmail) {
          const { value: userDetailsValue } = await Preferences.get({ key: `user-${userEmail}` });
          if (userDetailsValue) {
            const detailedData: UserData = JSON.parse(userDetailsValue);
            Object.assign(user, detailedData);
          }
        }

        if (!user.name && (user.fullNames || user.surname)) {
          user.name = `${user.fullNames || ''} ${user.surname || ''}`.trim();
        }

        setUser(user);
        setEditForm({
          name: user.name || '',
          phone: user.phone || '',
          address: user.address || '',
          occupation: ''
        });

        const [{ value: avatarValue }, { value: settingsValue }] = await Promise.all([
          Preferences.get({ key: 'userAvatar' }),
          Preferences.get({ key: 'userSettings' })
        ]);

        if (avatarValue) setAvatar(avatarValue);
        if (settingsValue) setSettingsForm(JSON.parse(settingsValue));

      } catch (error) {
        console.error('Failed to load user data:', error);
        present({
          message: 'Error loading user data',
          duration: 2000,
          color: 'danger'
        });
      }
    };

    loadUserData();
  }, [present]);

  const handlePrivacyToggle = async (e: CustomEvent) => {
    const enabled = e.detail.checked;
    setPrivacyEnabled(enabled);
    await Preferences.set({ 
      key: 'privacySettings', 
      value: JSON.stringify({ cloudProcessing: !enabled }) 
    });
  };

  const handleLogout = async () => {
    await Preferences.remove({ key: 'userAuth' });
    present({
      message: 'Logged out successfully',
      duration: 2000,
      color: 'success'
    });
    history.push('/auth');
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const MAX_SIZE = 5 * 1024 * 1024;

      if (file.size > MAX_SIZE) {
        present({
          message: 'Image size exceeds 5MB limit',
          duration: 3000,
          color: 'danger'
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        await Preferences.set({ key: 'userAvatar', value: imageData });

        setAvatar(imageData);
        if (user) {
          const updatedUser = { ...user, avatar: imageData };
          setUser(updatedUser);

          await Preferences.set({
            key: 'userAuth',
            value: JSON.stringify(updatedUser)
          });

          if (user.email) {
            const { value } = await Preferences.get({ key: `user-${user.email}` });
            if (value) {
              const detailedData = JSON.parse(value);
              await Preferences.set({
                key: `user-${user.email}`,
                value: JSON.stringify({ ...detailedData, avatar: imageData })
              });
            }
          }
        }
      };
      reader.readAsDataURL(event.target.files[0]);
    }
  };

  const handleDeleteAvatar = async () => {
    await Preferences.remove({ key: 'userAvatar' });
    if (user && user.email) {
      const { value } = await Preferences.get({ key: `user-${user.email}` });
      if (value) {
        const detailedData = JSON.parse(value);
        delete detailedData.avatar;
        await Preferences.set({
          key: `user-${user.email}`,
          value: JSON.stringify(detailedData)
        });
      }
    }

    if (user) {
      const updatedUserAuth = { ...user };
      delete updatedUserAuth.avatar;
      await Preferences.set({ key: 'userAuth', value: JSON.stringify(updatedUserAuth) });
      setUser(updatedUserAuth);
    }

    setAvatar(null);
    setShowDeleteAvatarAlert(false);
    present({
      message: 'Avatar deleted successfully',
      duration: 2000,
      color: 'success'
    });
  };

  const handleEditProfile = async () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address
    };

    await Preferences.set({ key: 'userAuth', value: JSON.stringify(updatedUser) });
    setUser(updatedUser);
    setShowEditProfile(false);

    present({
      message: 'Profile updated successfully',
      duration: 2000,
      color: 'success'
    });
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      present({
        message: 'Passwords do not match',
        duration: 2000,
        color: 'danger'
      });
      return;
    }

    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePassword(false);

    present({
      message: 'Password changed successfully',
      duration: 2000,
      color: 'success'
    });
  };

  const handleSettingsChange = async () => {
    await Preferences.set({ key: 'userSettings', value: JSON.stringify(settingsForm) });
    present({
      message: 'Settings saved',
      duration: 2000,
      color: 'success'
    });
  };

  const handleContactSubmit = async () => {
    console.log('Contact form submitted:', contactForm);
    present({
      message: 'Your message has been sent!',
      duration: 3000,
      color: 'success'
    });
    setShowContactForm(false);
    setContactForm({ name: '', email: '', message: '' });
  };

  const profileInputStyle = {
    '--background': 'var(--ion-color-light)',
    '--border-radius': '12px',
    '--padding-start': '10px',
    '--padding-end': '10px',
    marginBottom: '15px'
  };

  const inputIconStyle = {
    color: 'var(--ion-color-medium)',
    fontSize: '20px',
    marginRight: '10px'
  };

  const inputFieldStyle = {
    color: 'var(--ion-color-dark)'
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
              onClick={() => history.push('/home')}
              style={{
                '--background': 'transparent',
                '--background-hover': 'rgba(255,255,255,0.1)',
                margin: '0',
                '--padding-end': '32px'
              }}
            >
              <IonIcon
                icon={close}
                style={{
                  color: 'var(--ion-color-primary)',
                  fontSize: '24px'
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
        <IonCard style={{
          textAlign: 'center',
          margin: '20px 0',
          boxShadow: 'none',
          borderRadius: '15px',
          '--background': 'var(--ion-color-light)'
        }}>
          <IonCardHeader>
            <IonGrid>
              <IonRow style={{ justifyContent: 'center' }}>
                <IonCol size="auto">
                  <div style={{ position: 'relative' }}>
                    <IonAvatar style={{
                      width: '120px',
                      height: '120px',
                      margin: '0 auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--ion-color-primary)'
                    }}>
                      {avatar ? (
                        <IonImg
                          src={avatar}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '50%'
                          }}
                        />
                      ) : (
                        <IonIcon
                          icon={person}
                          style={{
                            color: 'white',
                            fontSize: '60px'
                          }}
                        />
                      )}
                    </IonAvatar>
                    <label htmlFor="avatar-upload" style={{
                      position: 'absolute',
                      bottom: '0',
                      right: '0',
                      background: 'var(--ion-color-primary)',
                      borderRadius: '50%',
                      padding: '8px',
                      cursor: 'pointer'
                    }}>
                      <IonIcon icon={camera} style={{ color: 'white', padding: '0 0 0 3px', fontSize: '20px' }} />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                </IonCol>
              </IonRow>
              <IonRow style={{ justifyContent: 'center' }}>
                <IonCol size="auto">
                  <IonCardTitle style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                    {user?.name || 'User'}
                  </IonCardTitle>
                  <IonCardSubtitle style={{ color: 'var(--ion-color-medium)' }}>
                    {user?.email || 'email@example.com'}
                  </IonCardSubtitle>
                </IonCol>
              </IonRow>

              {user && (
                <IonRow style={{ marginTop: '16px', textAlign: 'left' }}>
                  <IonCol>
                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={() => setShowEditProfile(!showEditProfile)}
                      style={{ '--border-radius': '12px', margin: '16px 0 0 0' }}
                    >
                      <IonIcon icon={create} slot="start" />
                      Edit Profile
                    </IonButton>
                    {avatar && (
                      <IonButton
                        expand="block"
                        fill="outline"
                        color="danger"
                        onClick={() => setShowDeleteAvatarAlert(true)}
                        style={{ '--border-radius': '12px', margin: '8px 0 0 0' }}
                      >
                        <IonIcon icon={trash} slot="start" />
                        Delete Avatar
                      </IonButton>
                    )}
                  </IonCol>
                </IonRow>
              )}
            </IonGrid>
          </IonCardHeader>
        </IonCard>

        {showEditProfile && (
          <IonCard style={{
            marginBottom: '16px',
            borderRadius: '12px',
            '--background': 'var(--ion-color-light-shade)'
          }}>
            <IonList lines="none">
              <IonItem style={profileInputStyle}>
                <IonIcon icon={personCircle} slot="start" style={inputIconStyle} />
                <IonInput
                  value={editForm.name}
                  placeholder="Full Name"
                  onIonChange={e => setEditForm({...editForm, name: e.detail.value!})}
                  style={inputFieldStyle}
                />
              </IonItem>

              <IonItem style={profileInputStyle}>
                <IonIcon icon={mail} slot="start" style={inputIconStyle} />
                <IonInput
                  value={user?.email || ''}
                  placeholder="Email"
                  type="email"
                  disabled
                  style={inputFieldStyle}
                />
              </IonItem>

              <IonItem style={profileInputStyle}>
                <IonIcon icon={call} slot="start" style={inputIconStyle} />
                <IonInput
                  value={editForm.phone}
                  placeholder="Phone Number"
                  type="tel"
                  onIonChange={e => setEditForm({...editForm, phone: e.detail.value!})}
                  style={inputFieldStyle}
                />
              </IonItem>

              <IonItem style={profileInputStyle}>
                <IonIcon icon={home} slot="start" style={inputIconStyle} />
                <IonInput
                  value={editForm.address}
                  placeholder="Address"
                  onIonChange={e => setEditForm({...editForm, address: e.detail.value!})}
                  style={inputFieldStyle}
                />
              </IonItem>

              <IonItem style={profileInputStyle}>
                <IonIcon icon={briefcase} slot="start" style={inputIconStyle} />
                <IonInput
                  value={editForm.occupation}
                  placeholder="Occupation"
                  onIonChange={e => setEditForm({...editForm, occupation: e.detail.value!})}
                  style={inputFieldStyle}
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={handleEditProfile}
                style={{ '--border-radius': '12px', color:'white', margin: '16px' }}
              >
                <IonIcon icon={save} slot="start" />
                Save Changes
              </IonButton>
            </IonList>
          </IonCard>
        )}

        <IonList
          lines="none"
          style={{
            background: 'transparent',
            marginBottom: '1rem',
            marginTop: '8px'
          }}
        >
          <IonItem
            button
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{
              '--border-radius': '12px',
              '--padding-start': '10px',
              '--padding-end': '10px',
              '--background': 'var(--ion-color-light)',
              marginBottom: '12px'
            }}
          >
            <IonIcon slot="start" icon={lockClosed} style={{ '--border-radius': '12px', fontSize: '1.2rem' }} />
            <IonLabel>Change Password</IonLabel>
            <IonIcon
              icon={showChangePassword ? chevronUp : chevronDown}
              slot="end"
            />
          </IonItem>

          {showChangePassword && (
            <IonCard style={{
              marginBottom: '12px',
              borderRadius: '0 0 12px 12px',
              '--background': 'var(--ion-color-light-shade)'
            }}>
              <IonList lines="none">
                <IonItem>
                  <IonInput
                    value={passwordForm.currentPassword}
                    placeholder="Current Password"
                    type="password"
                    onIonChange={e => setPasswordForm({...passwordForm, currentPassword: e.detail.value!})}
                  />
                </IonItem>

                <IonItem>
                  <IonInput
                    value={passwordForm.newPassword}
                    placeholder="New Password"
                    type="password"
                    onIonChange={e => setPasswordForm({...passwordForm, newPassword: e.detail.value!})}
                  />
                </IonItem>

                <IonItem>
                  <IonInput
                    value={passwordForm.confirmPassword}
                    placeholder="Confirm New Password"
                    type="password"
                    onIonChange={e => setPasswordForm({...passwordForm, confirmPassword: e.detail.value!})}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleChangePassword}
                  style={{
                    '--border-radius': '12px',
                    margin: '16px'
                  }}
                >
                  Change Password
                </IonButton>
              </IonList>
            </IonCard>
          )}

          <IonItem
            button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              '--border-radius': '12px',
              '--padding-start': '10px',
              '--padding-end': '10px',
              '--background': 'var(--ion-color-light)',
              marginBottom: '12px'
            }}
          >
            <IonIcon slot="start" icon={settings} style={{ fontSize: '1.2rem' }} />
            <IonLabel>Settings</IonLabel>
            <IonIcon
              icon={showSettings ? chevronUp : chevronDown}
              slot="end"
            />
          </IonItem>

          {showSettings && (
            <IonCard style={{
              marginBottom: '12px',
              borderRadius: '0 0 12px 12px',
              '--background': 'var(--ion-color-light-shade)'
            }}>
              <IonList lines="none">
                <IonItem>
                  <IonLabel>Enable Notifications</IonLabel>
                  <IonToggle
                    checked={settingsForm.notifications}
                    onIonChange={e => setSettingsForm({...settingsForm, notifications: e.detail.checked})}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Biometric Authentication</IonLabel>
                  <IonToggle
                    checked={settingsForm.biometricAuth}
                    onIonChange={e => setSettingsForm({...settingsForm, biometricAuth: e.detail.checked})}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel>Enable Cloud AI Processing</IonLabel>
                  <IonToggle
                    checked={!privacyEnabled}
                    onIonChange={handlePrivacyToggle}
                  />
                </IonItem>

                <IonButton
                  expand="block"
                  onClick={handleSettingsChange}
                  style={{
                    '--border-radius': '12px',
                    margin: '16px'
                  }}
                >
                  Save Settings
                </IonButton>
              </IonList>
            </IonCard>
          )}

          <IonItem
            button
            onClick={() => setShowHelp(!showHelp)}
            style={{
              '--border-radius': '12px',
              '--padding-start': '10px',
              '--padding-end': '10px',
              '--background': 'var(--ion-color-light)',
              marginBottom: '12px'
            }}
          >
            <IonIcon slot="start" icon={helpCircle} style={{ fontSize: '1.2rem' }} />
            <IonLabel>Support</IonLabel>
            <IonIcon
              icon={showHelp ? chevronUp : chevronDown}
              slot="end"
            />
          </IonItem>

          {showHelp && (
            <IonCard style={{
              marginBottom: '12px',
              borderRadius: '0 0 12px 12px',
              '--background': 'var(--ion-color-light-shade)'
            }}>
              <div style={{ padding: '16px' }}>
                <IonText>
                  <h3 style={{ marginTop: '0', color: 'var(--ion-color-primary)' }}>About Wellness Journal</h3>
                  <p style={{ marginBottom: '24px', lineHeight: '1.6' }}>
                    Wellness Journal helps you track your mental health journey through daily reflections, mood tracking, 
                    and personalized insights. Our mission is to make mental health management 
                    accessible to everyone.
                  </p>
                </IonText>

                <IonText>
                  <h3 style={{ margin: '24px 0 16px 0', color: 'var(--ion-color-primary)' }}>Frequently Asked Questions</h3>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <p><strong>Q: How do I change my profile information?</strong></p>
                    <p>A: Navigate to Profile → Edit Profile to update your details.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p><strong>Q: How do I change my password?</strong></p>
                    <p>A: Go to Profile → Change Password and follow the prompts.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p><strong>Q: Is my journal data private?</strong></p>
                    <p>A: Absolutely. All entries are encrypted and only accessible by you.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p><strong>Q: Can I export my journal entries?</strong></p>
                    <p>A: Currently no, export options will be available in Settings → Data Management.</p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <p><strong>Q: How do I contact support?</strong></p>
                    <p>A: Email support@wellnessjournal.app or call +27 81 344 1348 (Mon-Fri, 9am-5pm SAST).</p>
                  </div>
                </IonText>

                <IonButton
                  expand="block"
                  onClick={() => setShowContactForm(true)}
                  style={{ 
                    '--border-radius': '12px', 
                    marginTop: '24px',
                    '--background': 'var(--ion-color-primary)',
                    color: 'white'
                  }}
                >
                  <IonIcon icon={mail} slot="start" />
                  Contact us
                </IonButton>
              </div>
            </IonCard>
          )}

          <IonModal 
            isOpen={showContactForm} 
            onDidDismiss={() => setShowContactForm(false)}
            style={{
              '--width': '100%',
              '--height': '100%',
              '--border-radius': '12px 12px 0 0' 
            }}
          >
            <IonHeader>
              <IonToolbar style={{
                '--background': 'transparent',
                '--border-width': '0',
                padding: '8px'
              }}>
                <IonButtons slot="end">
                  <IonButton 
                    onClick={() => setShowContactForm(false)}
                    style={{color: 'var(--ion-color-primary)'}}
                  >
                    <IonIcon icon={close} />
                  </IonButton>
                </IonButtons>
                <IonTitle style={{
                  fontSize: '1.25rem',
                  fontWeight: '600'
                }}>
                  Contact
                </IonTitle>
              </IonToolbar>
            </IonHeader>

            <IonContent style={{
              '--padding-top': '16px',
              '--padding-bottom': '16px',
              '--padding-start': '16px',
              '--padding-end': '16px',
              marginBottom: '16px'
            }}>
              <IonText style={{
                display: 'block',
                textAlign: 'center',
                marginBottom: '24px',
                fontSize: '0.95rem',
                color: 'var(--ion-color-medium)',
                padding: '0 16px'
              }}>
                <p>Have questions? Fill in the form below, we typically respond to inquiries within 24-48 hours.</p>
              </IonText>
              <div style={{
                borderRadius: '15px',
                overflow: 'hidden'
              }}>
                <IonList>
                  <IonItem style={{
                    '--background': 'transparent',
                    '--border-width': '0',
                    padding: '0',
                    marginBottom: '16px'
                  }}>
                    <IonLabel position="stacked">Your Name</IonLabel>
                    <IonInput
                      value={contactForm.name}
                      onIonChange={e => setContactForm({...contactForm, name: e.detail.value!})}
                      style={{
                        border: '1px solid var(--ion-color-light-shade)',
                        borderRadius: '12px',
                        padding: '12px',
                        marginTop: '8px'
                      }}
                    />
                  </IonItem>

                  <IonItem style={{
                    '--background': 'transparent',
                    '--border-width': '0',
                    padding: '0',
                    marginBottom: '16px'
                  }}>
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={contactForm.email}
                      onIonChange={e => setContactForm({...contactForm, email: e.detail.value!})}
                      style={{
                        border: '1px solid var(--ion-color-light-shade)',
                        borderRadius: '12px',
                        padding: '12px',
                        marginTop: '8px'
                      }}
                    />
                  </IonItem>

                  <IonItem style={{
                    '--background': 'transparent',
                    '--border-width': '0',
                    padding: '0',
                    marginBottom: '16px'
                  }}>
                    <IonLabel position="stacked">Message</IonLabel>
                    <IonTextarea
                      rows={6}
                      value={contactForm.message}
                      onIonChange={e => setContactForm({...contactForm, message: e.detail.value!})}
                      style={{
                        border: '1px solid var(--ion-color-light-shade)',
                        borderRadius: '12px',
                        padding: '12px',
                        marginTop: '8px'
                      }}
                    />
                  </IonItem>
                </IonList>
              </div>

              <IonButton
                expand="block"
                onClick={handleContactSubmit}
                style={{
                  '--border-radius': '12px',
                  marginTop: '16px', 
                  color: 'white',
                }}
              >
                Send Message
              </IonButton>
            </IonContent>
          </IonModal>

          <IonItem
            button
            onClick={() => setShowTerms(!showTerms)}
            style={{
              '--border-radius': '12px',
              '--padding-start': '10px',
              '--padding-end': '10px',
              '--background': 'var(--ion-color-light)',
              marginBottom: '12px'
            }}
          >
            <IonIcon 
              slot="start" 
              icon={documentText} 
              style={{ 
                fontSize: '1.2rem',
              }} 
            />
            <IonLabel>Terms of Service</IonLabel>
            <IonIcon
              icon={showTerms ? chevronUp : chevronDown}
              slot="end"
              color="medium"
            />
          </IonItem>

          {showTerms && (
            <IonCard style={{
              marginBottom: '12px',
              borderRadius: '0 0 12px 12px',
              '--background': 'var(--ion-color-light-shade)',
              display: 'flex',
              flexDirection: 'column',
              height: '400px'
            }}>
              <div style={{
                padding: '16px',
                overflowY: 'auto',
                flex: '1',
                maxHeight: 'calc(400px - 72px)'
              }}>
                <IonText>
                  <h4 style={{ marginTop: '0' }}>Wellness Journal Terms of Service</h4>
                  
                  <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
                  
                  <h5>1. Acceptance of Terms</h5>
                  <p>By using Wellness Journal, you agree to these terms and our Privacy Policy.</p>
                  
                  <h5>2. Data Privacy</h5>
                  <p>Your journal entries are encrypted and remain private. We don't share your data with third parties.</p>
                  
                  <h5>3. Account Responsibility</h5>
                  <p>You're responsible for maintaining the confidentiality of your account credentials.</p>
                  
                  <h5>4. Service Modifications</h5>
                  <p>We may update or discontinue features with reasonable notice.</p>
                  
                  <h5>5. Limitation of Liability</h5>
                  <p>Wellness Journal isn't a substitute for professional medical advice.</p>
                  
                  <h5>6. User Conduct</h5>
                  <p>You agree not to use the service for any unlawful purpose or in any way that might harm the service.</p>
                  
                  <h5>7. Intellectual Property</h5>
                  <p>All content and trademarks remain the property of Wellness Journal.</p>
                  
                  <h5>8. Termination</h5>
                  <p>We reserve the right to terminate accounts that violate these terms.</p>
                  
                  <h5>9. Governing Law</h5>
                  <p>These terms are governed by the laws of South Africa.</p>
                </IonText>
              </div>

              <IonButton
                expand="block"
                onClick={() => setShowTerms(false)}
                style={{
                  '--border-radius': '12px',
                  margin: '16px',
                  '--background': 'var(--ion-color-primary)'
                }}
              >
                I Understand
              </IonButton>
            </IonCard>
          )}

          <IonButton
            expand="block"
            color="danger"
            onClick={() => setShowLogoutAlert(true)}
            style={{
              '--border-radius': '12px',
              marginTop: '54px',
              marginBottom: '12px',
            }}
          >
            <IonIcon slot="start" icon={logOut} />
            <IonText style={{color:'black'}}>logout</IonText>
          </IonButton>
        </IonList>

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header={'Logout'}
          message={'Are you sure you want to log out?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Confirm',
              handler: handleLogout
            }
          ]}
        />

        <IonAlert
          isOpen={showDeleteAvatarAlert}
          onDidDismiss={() => setShowDeleteAvatarAlert(false)}
          header={'Delete Avatar'}
          message={'Are you sure you want to delete your profile picture?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Delete',
              handler: handleDeleteAvatar
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
