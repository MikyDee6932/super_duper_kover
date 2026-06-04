import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Fonts, BgGradient } from '@/constants/colors';
import { KButton } from '@/components/ui/KButton';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw error;
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Sign in failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Enter your email first', 'We\'ll send a reset link to your email address.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email', 'A password reset link has been sent.');
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

      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to continue your journey.</Text>

      <View style={styles.form}>
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
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password</Text>
            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor={Colors.fg4}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="password"
          />
        </View>

        <KButton variant="primary" full loading={loading} onPress={handleLogin}>
          Sign In
        </KButton>
      </View>

      <TouchableOpacity onPress={() => router.replace('/(auth)/welcome')} style={styles.signupLink}>
        <Text style={styles.signupText}>New here? <Text style={styles.signupBold}>Take the quiz</Text></Text>
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.fg2,
  },
  forgotText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    color: Colors.emerald500,
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
  signupLink: {
    alignItems: 'center',
    marginTop: 32,
  },
  signupText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.fg3,
  },
  signupBold: {
    fontFamily: Fonts.sansSemiBold,
    color: Colors.emerald500,
    fontWeight: '600',
  },
});
