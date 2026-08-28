import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessage { id: string; role: 'user' | 'ai'; text: string; }

const QUICK_ACTIONS = [
  { label: 'Add Product', icon: 'camera-outline', prompt: 'Help me add a new product' },
  { label: 'Check Sales', icon: 'bar-chart-outline', prompt: 'How are my sales doing?' },
  { label: 'Set Price', icon: 'cash-outline', prompt: 'Help me set a good price' },
  { label: 'Find Buyers', icon: 'search-outline', prompt: 'Help me find buyers' },
];

const MOCK_RESPONSES: Record<string, string> = {
  default: 'I understand! Let me help you with that. Your business is doing well — 4 products live, 2 new orders this week. How can I assist you further?',
  add: 'Sure! To add a product, tap the camera button on the home screen or say "Add new product". I will take you through the process step by step.',
  sales: 'Your sales this month are ₹42,500 — that\'s 18% up from last month! Your top seller is the Patola Silk Saree. Want to know what\'s driving this growth?',
  price: 'Based on current market trends, I recommend pricing your handmade items 15-20% above raw material cost. For your silk sarees, ₹2,499 seems optimal.',
  buyers: 'I found 5 active buyers interested in handloom products from Gujarat this week. Want me to help you connect with them?',
};

export const AIAssistantScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', role: 'ai', text: 'Namaste! I\'m Artisan-AI, your business assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = React.useRef<FlatList>(null);

  const sendMessage = async (text: string = input) => {
    if (!text.trim()) return;
    const userMsg: ChatMessage = { id: `u_${Date.now()}`, role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setIsTyping(true);

    await new Promise((r) => setTimeout(r, 1000));

    const lower = text.toLowerCase();
    const response = lower.includes('add') ? MOCK_RESPONSES.add
      : lower.includes('sale') ? MOCK_RESPONSES.sales
      : lower.includes('price') ? MOCK_RESPONSES.price
      : lower.includes('buyer') ? MOCK_RESPONSES.buyers
      : MOCK_RESPONSES.default;

    setIsTyping(false);
    setMessages((m) => [...m, { id: `ai_${Date.now()}`, role: 'ai', text: response }]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderItem = ({ item }: { item: ChatMessage }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
      {item.role === 'ai' && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={14} color={colors.primary} />
        </View>
      )}
      <Text style={[styles.bubbleText, item.role === 'user' && styles.userBubbleText]}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.headerTitle}>Artisan-AI</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={isTyping ? (
          <View style={[styles.bubble, styles.aiBubble]}>
            <View style={styles.aiAvatar}><Ionicons name="sparkles" size={14} color={colors.primary} /></View>
            <Text style={styles.bubbleText}>Thinking...</Text>
          </View>
        ) : null}
      />

      {/* Quick actions */}
      {messages.length <= 1 && (
        <View style={styles.quickActions}>
          <Text style={styles.quickLabel}>Quick actions</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((qa) => (
              <TouchableOpacity key={qa.label} style={styles.quickBtn} onPress={() => sendMessage(qa.prompt)}>
                <Ionicons name={qa.icon as any} size={18} color={colors.primary} />
                <Text style={styles.quickBtnText}>{qa.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Input bar */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type or tap mic to speak..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />
          <TouchableOpacity style={styles.micBtn} onPress={() => {}}>
            <Ionicons name="mic-outline" size={22} color={colors.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage()} disabled={!input.trim()}>
            <Ionicons name="send" size={18} color={input.trim() ? '#fff' : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  closeBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  messagesList: { paddingHorizontal: layout.screenPadding, paddingVertical: 16, gap: 12 },
  bubble: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '85%' },
  aiBubble: { alignSelf: 'flex-start' },
  userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EBF5FF', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bubbleText: { backgroundColor: colors.surface, borderRadius: 16, borderTopLeftRadius: 4, padding: 12, fontSize: 14, color: colors.textPrimary, lineHeight: 20, flex: 1 },
  userBubbleText: { backgroundColor: colors.primary, color: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 4 },
  quickActions: { paddingHorizontal: layout.screenPadding, paddingBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EBF5FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  quickBtnText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: layout.screenPadding, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, backgroundColor: colors.background },
  input: { flex: 1, minHeight: 42, maxHeight: 100, backgroundColor: colors.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  micBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
