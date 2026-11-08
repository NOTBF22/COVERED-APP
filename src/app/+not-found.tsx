import { Redirect } from 'expo-router';

/** Unknown addresses (e.g. an old or mistyped link) go back to the start. */
export default function NotFound() {
  return <Redirect href="/" />;
}
