import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Animated, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languageNames, languages, setLanguage } from '../../i18n';
import { useAppState } from '../../state/AppState';
import { Button, Card, Chip, Field, ListPicker, palette, Screen, styles, Title } from '../../ui';
import { DatePicker } from '../../components/DatePicker';
import { PlaceSearch } from '../../components/PlaceSearch';
import { PlaceLocation } from '../../services/places';

const eventTypes = [
  ['Kenduri Kahwin Melayu', 'eventMalay'], ['Chinese wedding', 'eventChinese'], ['Indian wedding', 'eventIndian'], ['Indonesian wedding', 'eventIndonesian'],
  ['Pertunangan', 'eventEngagement'], ['Aqiqah', 'eventAqiqah'], ['Majlis Hari Jadi', 'eventBirthday'], ['Majlis Korporat', 'eventCorporate'],
  ['Majlis Akad Nikah', 'eventNikah'], ['Kenduri Doa Selamat', 'eventKenduri'], ['Reunion', 'eventReunion'], ['Festival / Acara Awam', 'eventFestival'],
] as const;
const malaysianStates = ['Kuala Lumpur', 'Selangor', 'Putrajaya', 'Johor', 'Pulau Pinang', 'Perak', 'Negeri Sembilan', 'Melaka', 'Pahang', 'Kedah', 'Kelantan', 'Terengganu', 'Perlis', 'Sabah', 'Sarawak', 'Labuan'];
const totalSteps = 6;
// Setup fields are an open line rather than a boxed input.
const lineField = { borderWidth: 0, borderBottomWidth: 1.5, borderRadius: 0, backgroundColor: 'transparent', paddingHorizontal: 2, fontSize: 20 } as const;

function NavIcon({ icon, label, onPress, primary = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; primary?: boolean }) {
  const size = primary ? 60 : 48;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, transform: [{ scale: pressed ? 0.9 : 1 }] })}>
      {primary ? (
        <LinearGradient colors={['#A52C4D', '#6E142D']} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={28} color={palette.white} />
        </LinearGradient>
      ) : (
        <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: palette.maroon, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={22} color={palette.maroon} />
        </View>
      )}
    </Pressable>
  );
}

export default function Setup() {
  const { t, i18n } = useTranslation();
  const { createEvent, demoCleanupPending, acknowledgeDemo } = useAppState();
  const [step, setStep] = useState(0);
  const [type, setType] = useState<string>(eventTypes[0][0]);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [secondDate, setSecondDate] = useState('');
  const [venue, setVenue] = useState('');
  const [venueLocation, setVenueLocation] = useState<PlaceLocation>();
  const [budget, setBudget] = useState('');
  const [guests, setGuests] = useState('');
  const [fade] = useState(() => new Animated.Value(1));
  const [direction, setDirection] = useState(1);
  // Each step slides in from the side it came from and fades up.
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [fade, step]);
  const go = (by: number) => { setDirection(by); setStep((current) => current + by); };

  useEffect(() => {
    if (demoCleanupPending) Alert.alert(t('oldDemoTitle'), t('oldDemoBody'), [{ text: t('continue'), onPress: acknowledgeDemo }]);
  }, [acknowledgeDemo, demoCleanupPending, t]);

  const valuesAreValid = () => {
    if (step === 2 && [date, secondDate].some((value) => value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T12:00:00`).getTime())))) { Alert.alert(t('invalidDate')); return false; }
    if (step === 4 && [budget, guests].some((value) => value !== '' && (!Number.isFinite(Number(value)) || Number(value) < 0))) { Alert.alert(t('invalidNumber')); return false; }
    return true;
  };
  const complete = () => {
    if (!valuesAreValid()) return;
    createEvent({ type, name: name.trim() || t(eventTypes.find(([id]) => id === type)?.[1] || 'eventMalay'), date: date || null, additionalDates: secondDate ? [secondDate] : [], venue: venue.trim(), venueLocation, country: type === 'Indonesian wedding' ? 'ID' : 'MY', totalBudget: budget ? Number(budget) : 0, estimatedGuests: guests ? Number(guests) : 0 });
    router.replace('/(user)/notification-opt-in');
  };
  const next = () => { if (!valuesAreValid()) return; if (step === totalSteps - 1) complete(); else go(1); };
  const last = step === totalSteps - 1;

  const footer = (
    <View style={styles.between}>
      {step > 0 ? <NavIcon icon="arrow-back" label={t('back')} onPress={() => go(-1)} /> : <View style={{ width: 48 }} />}
      <View style={[styles.row, { gap: 16 }]}>
        {step > 0 && !last ? <NavIcon icon="play-skip-forward" label={t('skipForNow')} onPress={() => go(1)} /> : null}
        <NavIcon primary icon={last ? 'checkmark' : 'arrow-forward'} label={last ? t('finish') : t('continue')} onPress={next} />
      </View>
    </View>
  );

  return <Screen footer={footer}>
    <Text style={styles.muted}>{t('stepProgress', { current: step + 1, total: totalSteps })}</Text>
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: totalSteps, now: step + 1 }} style={{ height: 8, borderRadius: 8, backgroundColor: palette.line, overflow: 'hidden' }}><View style={{ width: `${((step + 1) / totalSteps) * 100}%`, height: '100%', backgroundColor: palette.maroon }} /></View>
    <Animated.View style={{ gap: 16, opacity: fade, transform: [{ translateX: fade.interpolate({ inputRange: [0, 1], outputRange: [24 * direction, 0] }) }] }}>
    <Title>{step === 0 ? t('chooseEventType') : step === 1 ? t('eventName') : step === 2 ? t('eventDate') : step === 3 ? t('venue') : step === 4 ? `${t('totalBudget')} & ${t('estimatedGuests')}` : t('invitePartnerTitle')}</Title>
    {step === 0 ? <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <Ionicons name="language-outline" size={18} color={palette.muted} />
        {languages.map((language) => <Chip key={language} label={languageNames[language]} active={i18n.language === language} onPress={() => void setLanguage(language)} />)}
      </View>
      <View style={{ gap: 8 }}>{eventTypes.map(([id, key]) => <Button key={id} label={t(key)} onPress={() => setType(id)} secondary={type !== id} />)}</View>
    </> : null}
    {step === 1 ? <><Text style={styles.muted}>{t('eventNameHint')}</Text><Field value={name} onChangeText={setName} placeholder={t('eventNameHint')} style={lineField} autoFocus /></> : null}
    {step === 2 ? <>
      <Text style={styles.muted}>{t('dateHint')}</Text>
      <DatePicker value={date} onChange={setDate} />
      {date ? <Text style={[styles.label, { color: palette.maroon, textAlign: 'center' }]}>{new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text> : null}
      <Field value={secondDate} onChangeText={setSecondDate} placeholder={t('additionalEventDate')} keyboardType="numbers-and-punctuation" style={lineField} />
    </> : null}
    {step === 3 ? <>
      <Text style={styles.muted}>{t('venueHint')}</Text>
      <PlaceSearch value={venue} onChangeText={(text) => { setVenue(text); setVenueLocation(undefined); }} onSelect={setVenueLocation} country={type === 'Indonesian wedding' ? 'ID' : 'MY'} />
      {type !== 'Indonesian wedding' ? <>
        <ListPicker icon="map-outline" label={t('orChooseState')} value={malaysianStates.includes(venue) ? venue : ''} options={malaysianStates.map((state) => [state, state] as const)} onChange={(state) => { setVenue(state); setVenueLocation(undefined); }} placeholder="—" />
      </> : null}
    </> : null}
    {step === 4 ? <><Text style={styles.muted}>{t('budgetHint')}</Text><Field value={budget} onChangeText={setBudget} placeholder={t('totalBudget')} keyboardType="numeric" style={lineField} /><Text style={styles.muted}>{t('guestHint')}</Text><Field value={guests} onChangeText={setGuests} placeholder={t('estimatedGuests')} keyboardType="numeric" style={lineField} /></> : null}
    {step === 5 ? <Card><Text style={styles.label}>{t('invitePartnerTitle')}</Text><Text style={styles.muted}>{t('invitePartnerHint')}</Text></Card> : null}
    </Animated.View>
  </Screen>;
}
