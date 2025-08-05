import { IonPage, IonContent } from '@ionic/react';
import { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { useHistory } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';

const SplashScreenPage = () => {
  const history = useHistory();

  useEffect(() => {
    const init = async () => {
      await SplashScreen.show({ autoHide: false });

      const { value } = await Preferences.get({ key: 'hasCompletedOnboarding' });
      const { value: authValue } = await Preferences.get({ key: 'userAuth' });

      setTimeout(async () => {
        await SplashScreen.hide();

        if (!value) {
          history.replace('/onboarding');
        } else if (!authValue) {
          history.replace('/auth');
        } else {
          history.replace('/home');
        }
      }, 2000);
    };

    init();
  }, [history]);

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{
          height: '100%',
          background: 'linear-gradient(135deg, var(--ion-color-primary) 60%, var(--ion-color-secondary) 100%)',
          padding: 0,
        }}
      >
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            padding: '2rem',
            boxSizing: 'border-box',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'background-color 0.3s ease',
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: '1.2rem',
            textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
          }}
        >
          <img
            src="chimp.png"
            alt="MindJournal"
            style={{
              width: '30vw',
              maxWidth: '180px',
              minWidth: '100px',
              height: 'auto',
              marginBottom: '2rem',
              borderRadius: '50%',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'transform 0.3s ease',
              transform: 'scale(1.1)',
              filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
            }}
          />
          <h1
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: '2rem',
              letterSpacing: '2px',
              textAlign: 'center',
              textTransform: 'uppercase',
              marginTop: 0,
              margin: 0
            }}
          >
            MindJournal
          </h1>
          <p
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '1rem',
              textAlign: 'center',
              marginTop: '1rem',
              marginBottom: 0,
              maxWidth: '80vw'
            }}
          >
            Your personal space for reflection and growth
          </p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default SplashScreenPage;