import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email.trim() || !password || !name.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) throw error;
      router.replace('/(auth)/onboarding/1');
    } catch (e: any) {
      Alert.alert('Sign up failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={BgGradient.colors} locations={BgGradient.locations} style={{ flex: 1 }}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Start your journey to freedom today.</Text>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>First name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={Colors.fg4}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            textContentType="givenName"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.fg4}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 8 characters"
            placeholderTextColor={Colors.fg4}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
          />
        </View>

        <KButton variant="primary" full loading={loading} onPress={handleSignup}>
          Create Account
        </KButton>

        <Text style={styles.terms}>
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </Text>
      </View>

      <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.loginLink}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginBold}>Sign in</Text></Text>
      </TouchableOpacity>
    </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
  },
  backBtn: {
    marginBottom: 24,
  },
  backText: {
    fontFamily: Fonts.sans,
    color: Colors.fg3,
    fontSize: 15,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 30,
    fontWeight: '700',
    color: Colors.fg1,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    color: Colors.fg3,
    lineHeight: 22,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.fg2,
  },
  input: {
    fontFamily: Fonts.sans,
    backgroundColor: Colors.bg2,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.hairlineStrong,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.fg1,
    fontSize: 16,
  },
  terms: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.fg4,
    textAlign: 'center',
    lineHeight: 18,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg3,
  },
  loginBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.emerald500,
    fontWeight: '600',
  },
});
