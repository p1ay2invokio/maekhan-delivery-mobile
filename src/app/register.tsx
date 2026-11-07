import { Redirect } from 'expo-router';

export default function RegisterScreen() {
  return <Redirect href={{ pathname: '/login', params: { mode: 'register' } }} />;
}
