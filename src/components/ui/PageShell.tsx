// @ts-nocheck
import React from 'react';
import { ScrollView, Platform, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/src/lib/constants';

/**
 * Shared page shell component.
 * On web: constrained-width centered container.
 * On native: SafeAreaView with proper insets.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'web') {
    return (
      <View style={webStyles.shell}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={webStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgBase }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const webStyles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: Colors.bgBase,
  },
  scrollContent: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 60,
    paddingHorizontal: 12,
  },
});
