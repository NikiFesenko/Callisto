// @ts-nocheck
import { Link, Stack } from 'expo-router';
import { YStack, Text } from 'tamagui';
import { Colors } from '@/src/lib/constants';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor={Colors.bgBase} padding="$4">
        <Text fontSize={48} marginBottom="$4">🌌</Text>
        <Text fontSize={22} fontWeight="700" color={Colors.textPrimary} marginBottom="$2">
          Page Not Found
        </Text>
        <Text fontSize={14} color={Colors.textSecondary} textAlign="center" marginBottom="$4">
          The page you're looking for doesn't exist.
        </Text>
        <Link href="/" style={{ color: Colors.indigo, fontWeight: '600', fontSize: 16 }}>
          Go to Dashboard →
        </Link>
      </YStack>
    </>
  );
}
