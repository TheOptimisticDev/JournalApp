import React, { useState, useRef } from 'react';
import { IonPage, IonContent, IonButton, IonImg, IonText, IonRow, IonCol } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';

const Onboarding: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const history = useHistory();

  const slides = [
    {
      image: 'ob1.png',
      title: 'Welcome to MindJournal',
      text: 'A private space for self-reflection, promoting personal growth and mental well-being through daily journaling.'
    },
    {
      image: 'ob2.png',
      title: 'Mood Tracking',
      text: 'Log emotions easily to understand mood patterns, gain self-awareness, and track your mental health journey.'
    },
    {
      image: 'ob3.png',
      title: 'Privacy and Security',
      text: 'Your personal reflections and data remain completely confidential, protected with advanced security measures always.'
    }
  ];

  const completeOnboarding = async () => {
    await Preferences.set({ key: 'hasCompletedOnboarding', value: 'true' });
    history.replace('/auth');
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartX.current) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    
    if (deltaX > 50) {
      if (currentSlide > 0) {
        setCurrentSlide(currentSlide - 1);
      }
    } else if (deltaX < -50) {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      }
    }
    
    touchStartX.current = null;
  };

  return (
    <IonPage style={{ margin: '20px' }}>
      <IonContent 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          textAlign: 'center',
          padding: '20px',
          touchAction: 'pan-y'
        }}
      >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          maxWidth: '100%',
          width: '100%'
        }}>
          <IonImg 
            src={slides[currentSlide].image}
            style={{
              width: '250px',
              height: '250px',
              marginBottom: '20px'
            }}
          />
          
          <IonText style={{ 
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            <h2>{slides[currentSlide].title}</h2>
          </IonText>

          
          <IonText style={{ 
            fontSize: '16px', 
            color: 'var(--ion-color-medium)', 
            marginBottom: '30px' 
          }}>
            <p>{slides[currentSlide].text}</p>
          </IonText>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '30px' 
          }}>
            {slides.map((_, index) => (
              <div 
                key={index}
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: index === currentSlide 
                    ? 'var(--ion-color-primary)' 
                    : 'var(--ion-color-light-shade)',
                  margin: '0 5px'
                }}
              />
            ))}
          </div>

          {currentSlide < slides.length - 1 ? (
            <IonRow style={{ width: '100%', maxWidth: '300px' }}>
              <IonCol>
                <IonButton 
                  fill="clear"
                  onClick={skipOnboarding}
                  style={{
                    width: '100%',
                    color: 'var(--ion-color-medium)'
                  }}
                >
                  Skip
                </IonButton>
              </IonCol>
              <IonCol>
                <IonButton 
                  expand="block"
                  onClick={nextSlide}
                  style={{
                    '--border-radius': '25px',
                    width: '100%'
                  }}
                >
                  Next
                </IonButton>
              </IonCol>
            </IonRow>
          ) : (
            <IonButton 
              expand="block"
              onClick={nextSlide}
              style={{
                '--border-radius': '25px',
                width: '80%',
                maxWidth: '300px'
              }}
            >
              Get Started
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Onboarding;
