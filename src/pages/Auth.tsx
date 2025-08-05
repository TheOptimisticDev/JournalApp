// Auth.tsx
import React, { useState } from 'react';
import {
  IonPage, IonContent, IonInput, IonButton, IonImg,
  IonText, IonItem, IonLabel, IonCheckbox, useIonToast, IonIcon
} from '@ionic/react';
import { Preferences } from '@capacitor/preferences';
import { useHistory } from 'react-router-dom';
import { logoGoogle } from 'ionicons/icons';

const Auth: React.FC = () => {
  const history = useHistory();
  const [isSignUp, setIsSignUp] = useState(false);
  const [present] = useIonToast();

  const [fullNames, setFullNames] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const presentToast = (message: string, color: string = 'danger') => {
    present({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
  };

  const handleSubmit = async () => {
    // Basic validation for both sign-in and sign-up
    if (!email || !password) {
      presentToast('Please enter both email and password.');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      presentToast('Please enter a valid email address.');
      return;
    }

    // Password length check
    if (password.length < 6) {
      presentToast('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp) {
      // Sign-up specific validations
      if (!fullNames || !surname) {
        presentToast('Please enter your full names and surname.');
        return;
      }
      if (password !== confirmPassword) {
        presentToast('Passwords do not match.');
        return;
      }
      if (!acceptTerms) {
        presentToast('You must accept the Terms & Conditions to sign up.');
        return;
      }

      const name = `${fullNames} ${surname}`;
      const userData = {
        name,
        email,
        fullNames,
        surname,
        // Do NOT store passwords in plain text!
      };

      // Only store non-sensitive user information
      const safeUserData = {
        name,
        email,
        fullNames,
        surname
      };

      await Preferences.set({
        key: 'userAuth',
        value: JSON.stringify(safeUserData)
      });

      await Preferences.set({
        key: `user-${email}`,
        value: JSON.stringify(safeUserData)
      });
      presentToast('Account created successfully!', 'success');
    } else {
      // Sign-in logic (simplified for this example)
      // In a real app, you would verify credentials against a backend.
      // For this local-storage based example, we'll mimic basic sign-in.
      const storedUserData = await Preferences.get({ key: `user-${email}` });
      if (storedUserData.value) {
        const user = JSON.parse(storedUserData.value);
        if (user.password === password) {
          await Preferences.set({
            key: 'userAuth',
            value: JSON.stringify({ email })
          });
          presentToast('Signed in successfully!', 'success');
        } else {
          presentToast('Invalid email or password.');
          return;
        }
      } else {
        presentToast('Invalid email or password.');
        return;
      }
    }

    history.replace('/home');
  };

  const handleGoogleSignIn = () => {
    presentToast('Google Sign-In functionality coming soon!', 'medium');
    // In a real app, you would initiate the Google OAuth flow here.
    // e.g., using Capacitor's Google Auth plugin or a Firebase SDK.
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        className="ion-padding"
        // Adjust IonContent background to allow inner div styling to show
        style={{
          padding: '16px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Main content container with styles from the snippet */}
        <div
          style={{
            height: 'auto', // Changed from 100% to auto to wrap content
            width: '100%',
            maxWidth: '400px', // Maintain max width for mobile responsiveness
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            paddingTop: '100px',
            boxSizing: 'border-box',
            transition: 'background-color 0.3s ease',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Logo with styles from the snippet */}
          <IonImg
            src="login.png"
            alt="App Logo"
            style={{
              width: '30vw',
              maxWidth: '180px',
              minWidth: '100px',
              height: 'auto',
              backgroundColor: 'transparent',
              marginBottom: '2rem'
            }}
          />
          {/* Sign-In/Create Account Title */}
          <h1
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: '1.5rem',
              letterSpacing: '2px',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginTop: 0,
              marginBottom: '1rem',
            }}
          >
            {isSignUp ? 'Create Account' : 'Sign-In'}
          </h1>
          {/* Input fields for email and password */}
          {isSignUp && (
            <>
              <IonItem lines="none" style={{ ...itemStyle, '--background': 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
                <IonInput
                  value={fullNames}
                  onIonChange={e => setFullNames(e.detail.value!)}
                  placeholder="Full names"
                  style={{ color: 'white' }}
                />
              </IonItem>

              <IonItem lines="none" style={{ ...itemStyle, '--background': 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
                <IonInput
                  value={surname}
                  onIonChange={e => setSurname(e.detail.value!)}
                  placeholder="Surname"
                  style={{ color: 'white' }}
                />
              </IonItem>
            </>
          )}

          <IonItem lines="none" style={{ ...itemStyle, '--background': 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
            <IonInput
              type="email"
              value={email}
              onIonChange={e => setEmail(e.detail.value!)}
              placeholder="Email"
              style={{ color: 'white' }}
            />
          </IonItem>

          <IonItem lines="none" style={{ ...itemStyle, '--background': 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
            <IonInput
              type="password"
              value={password}
              onIonChange={e => setPassword(e.detail.value!)}
              placeholder="password"
              style={{ color: 'white' }}
            />
          </IonItem>

          {isSignUp && (
            <>
              <IonItem lines="none" style={{ ...itemStyle, '--background': 'rgba(255, 255, 255, 0.15)', color: 'white' }}>
                <IonInput
                  type="password"
                  value={confirmPassword}
                  onIonChange={e => setConfirmPassword(e.detail.value!)}
                  placeholder="Confirm password"
                  style={{ color: 'white' }}
                />
              </IonItem>

              <IonItem lines="none" style={{
                width: '100%', marginTop: '8px',
                '--background': 'transparent', zIndex: 2
              }}>
                <IonCheckbox
                  slot="start"
                  checked={acceptTerms}
                  onIonChange={e => setAcceptTerms(e.detail.checked)}
                  style={{ '--checkbox-background-checked': 'var(--ion-color-primary)', '--border-color-checked': 'var(--ion-color-primary)' }}
                />
                <IonLabel style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  I agree to the Terms & Conditions
                </IonLabel>
              </IonItem>

              <IonText style={{
                fontSize: '0.85rem', // Adjusted font size
                color: 'rgba(255, 255, 255, 0.6)', // Lighter text color
                marginBottom: '12px',
                textAlign: 'left',
                width: '100%', zIndex: 2
              }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </IonText>
            </>
          )}

          <IonButton
            expand="block"
            onClick={handleSubmit}
            style={{
              width: '100%',
              marginTop: '16px',
              height: '48px',
              '--border-radius': '25px',
              color: 'white',
              fontWeight: 'bold',
              letterSpacing: '1px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {isSignUp ? 'Sign Up' : 'Submit'}
          </IonButton>

          {/* Separator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            margin: '20px 0',
            position: 'relative',
            zIndex: 2,
          }}>
            <div style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)', // Lighter line for separator
              marginRight: '10px',
            }}></div>
            <IonText style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
              OR
            </IonText>
            <div style={{
              flexGrow: 1,
              height: '1px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              marginLeft: '10px',
            }}></div>
          </div>

          {/* Google Sign-in Button */}
          <IonButton
            expand="block"
            onClick={handleGoogleSignIn}
            style={{
              width: '100%',
              height: '48px',
              '--border-radius': '25px',
              '--background': 'white',
              '--color': 'black',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <IonIcon icon={logoGoogle} slot="start" style={{ fontSize: '24px', marginRight: '8px' }} />
            Sign {isSignUp ? 'up' : 'in'} with Google
          </IonButton>

          <IonText style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '0.9rem', // Adjusted font size
            color: 'rgba(255, 255, 255, 0.8)', // Lighter text color
            position: 'relative',
            zIndex: 2,
          }}>
            <p>
              {isSignUp
                ? 'Already have an account? '
                : 'Don’t have an account? '}
              <span
                style={{
                  color: 'var(--ion-color-primary)', // Keeping Ionic's primary color for consistency
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </span>
            </p>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
};

// Common item styling - Adjusted for dark background and transparency
const itemStyle = {
  width: '100%',
  marginBottom: '16px',
  borderRadius: '25px',
  '--padding-start': '20px',
  '--padding-end': '20px',
  '--padding-top': '10px',
  '--padding-bottom': '10px',
  '--background': 'rgba(255, 255, 255, 0.15)', // Semi-transparent background for inputs
  '--highlight-background': 'transparent', // Remove highlight background on focus
  '--highlight-color': 'transparent', // Remove highlight color on focus
  '--border-color': 'transparent', // 
  color: 'white', // Default text color for input labels
};

export default Auth;
