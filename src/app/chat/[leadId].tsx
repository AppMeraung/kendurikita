import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import { validChatAttachment, validChatMessage } from "../../domain/chat";
import {
  ChatMessage,
  loadMessages,
  openChatAttachment,
  sendMessage,
  subscribeMessages,
} from "../../services/chat";
import { supabase } from "../../services/supabase";
import { ChatSafetyContext, loadChatSafetyContext, ReportTarget, setChatPartyBlocked, submitReport } from "../../services/safety";
import { Button, Card, Field, palette, Screen, styles, Title } from "../../ui";

type Attachment = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};
export default function Chat() {
  const { leadId = "" } = useLocalSearchParams<{ leadId: string }>();
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<Attachment>();
  const [userId, setUserId] = useState("");
  const [safety, setSafety] = useState<ChatSafetyContext | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: ReportTarget; id: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const load = async () => {
    try {
      setMessages(await loadMessages(leadId));
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id || "");
      setSafety(await loadChatSafetyContext(leadId));
    } catch (error) {
      Alert.alert(
        t("chatLoadFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    const channel = subscribeMessages(leadId, () => void load());
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);
  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;
    const file = result.assets[0];
    if (!validChatAttachment(file.mimeType || undefined, file.size))
      return Alert.alert(t("chatAttachmentInvalid"));
    setAttachment({
      uri: file.uri,
      name: file.name,
      mimeType: file.mimeType || "application/octet-stream",
      size: file.size,
    });
  };
  const send = async () => {
    if (!validChatMessage(body, !!attachment))
      return Alert.alert(t("chatMessageRequired"));
    try {
      await sendMessage(leadId, body, attachment);
      setBody("");
      setAttachment(undefined);
      await load();
    } catch (error) {
      Alert.alert(
        t("chatSendFailed"),
        error instanceof Error ? error.message : t("unknownError"),
      );
    }
  };
  const toggleBlock = async () => {
    if (!safety) return;
    try {
      await setChatPartyBlocked(leadId, !safety.blocked_by_me);
      setSafety(await loadChatSafetyContext(leadId));
      Alert.alert(t(safety.blocked_by_me ? "userUnblocked" : "userBlocked"));
    } catch (error) {
      Alert.alert(t("safetyActionFailed"), error instanceof Error ? error.message : t("unknownError"));
    }
  };
  const report = async () => {
    if (!reportTarget || reportReason.trim().length < 3) return Alert.alert(t("reportReasonRequired"));
    try {
      await submitReport(reportTarget.type, reportTarget.id, reportReason, reportDetails);
      setReportTarget(null); setReportReason(""); setReportDetails("");
      Alert.alert(t("reportSubmitted"));
    } catch (error) {
      Alert.alert(t("reportFailed"), error instanceof Error ? error.message : t("unknownError"));
    }
  };
  const chatBlocked = !!safety && (safety.blocked_by_me || safety.blocked_me);
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("chatTitle")}</Title>
      {safety ? <Card>
        <Text style={styles.muted}>{safety.other_name}</Text>
        {chatBlocked ? <Text style={styles.label}>{t(safety.blocked_by_me ? "chatBlockedByYou" : "chatUnavailable")}</Text> : null}
        <Button label={t(safety.blocked_by_me ? "unblockUser" : "blockUser")} onPress={() => void toggleBlock()} secondary />
        <Button label={t("reportUser")} onPress={() => setReportTarget({ type: "user", id: safety.other_user_id })} secondary />
      </Card> : null}
      {messages.map((message) => (
        <View
          key={message.id}
          style={{
            alignItems:
              message.sender_id === userId ? "flex-end" : "flex-start",
          }}
        >
          <Card>
            <Text style={styles.label}>
              {message.body || t("chatAttachment")}
            </Text>
            {message.attachment_path ? (
              <Button
                label={t("openAttachment")}
                onPress={() =>
                  void openChatAttachment(message.attachment_path!)
                }
                secondary
              />
            ) : null}
            <Text style={styles.muted}>
              {message.sender_id === userId
                ? message.read_at
                  ? t("chatRead")
                  : t("chatSent")
                : t("chatReceived")}
            </Text>
            {message.sender_id !== userId ? <Button label={t("reportMessage")} onPress={() => setReportTarget({ type: "message", id: message.id })} secondary /> : null}
          </Card>
        </View>
      ))}
      <Field
        value={body}
        onChangeText={setBody}
        placeholder={t("chatMessage")}
        multiline
        editable={!chatBlocked}
      />
      {attachment ? <Text style={styles.muted}>{attachment.name}</Text> : null}
      <Button label={t("attachFile")} onPress={() => void pick()} secondary disabled={chatBlocked} />
      <Button label={t("send")} onPress={() => void send()} disabled={chatBlocked} />
      <Modal visible={!!reportTarget} animationType="slide" onRequestClose={() => setReportTarget(null)}>
        <Screen>
          <Title>{t(reportTarget?.type === "message" ? "reportMessage" : "reportUser")}</Title>
          <Field value={reportReason} onChangeText={setReportReason} placeholder={t("reportReason")} />
          <Field value={reportDetails} onChangeText={setReportDetails} placeholder={t("reportDetails")} multiline />
          <Button label={t("submitReport")} onPress={() => void report()} />
          <Button label={t("cancel")} onPress={() => setReportTarget(null)} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
