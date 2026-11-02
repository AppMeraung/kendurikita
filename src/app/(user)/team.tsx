import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Modal, Pressable, Share, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import QRCode from "react-native-qrcode-svg";
import { TeamMember } from "../../domain";
import { userCanAdd } from "../../domain/entitlements";
import { useAppState } from "../../state/AppState";
import { useUserPlan } from "../../state/usePlan";
import { CloudMemberRole, createEventInvite } from "../../services/eventInvites";
import {
  Button,
  Card,
  Empty,
  Field,
  palette,
  Screen,
  styles,
  Title,
} from "../../ui";

const roleKeys = {
  partner: "rolePartner",
  family: "roleFamily",
  pic: "rolePic",
  viewer: "roleViewer",
  parent: "roleParent",
} as const;
const statusKeys = {
  local: "statusLocal",
  invited: "statusInvited",
  joined: "statusJoined",
} as const;
export default function Team() {
  const { t } = useTranslation();
  const { event, addTeamMember, updateTeamMember, deleteTeamMember } =
    useAppState();
  const { plan } = useUserPlan(event?.cloudId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<TeamMember["role"]>("pic");
  const [status, setStatus] = useState<TeamMember["status"]>("local");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  if (!event) return null;
  const clear = () => {
    setEditingId(null);
    setName("");
    setPhone("");
    setRole("pic");
    setStatus("local");
    setOpen(false);
  };
  const edit = (member: TeamMember) => {
    setEditingId(member.id);
    setName(member.name);
    setPhone(member.phone || "");
    setRole(member.role);
    setStatus(member.status);
    setOpen(true);
  };
  const submit = () => {
    if (!name.trim()) return Alert.alert(t("required"));
    if (!editingId && !userCanAdd(plan, "members", event.team.length))
      return Alert.alert(t("memberLimitReached"));
    const value = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      role,
      status,
    };
    if (editingId) updateTeamMember(editingId, value);
    else addTeamMember(value);
    clear();
  };
  const shareRole: CloudMemberRole = role === "partner" ? "partner" : role === "viewer" ? "viewer" : role === "parent" ? "parent" : "editor";
  const createInvite = async () => {
    if (!event.cloudId) return Alert.alert(t("syncCurrentEventFirst"));
    setInviteBusy(true);
    try { setInviteUrl(await createEventInvite(event.cloudId, shareRole)); }
    catch (error) { Alert.alert(t("createEventInviteFailed"), error instanceof Error ? error.message : t("unknownError")); }
    finally { setInviteBusy(false); }
  };
  return (
    <Screen>
      <Pressable accessibilityLabel={t("back")} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color={palette.maroon} />
      </Pressable>
      <Title>{t("teamTitle")}</Title>
      {event.team.length ? (
        event.team.map((member) => (
          <Card key={member.id}>
            <View style={styles.between}>
              <Pressable
                onPress={() => edit(member)}
                accessibilityLabel={`${t("edit")} ${member.name}`}
                style={{ flex: 1 }}
              >
                <Text style={styles.label}>{member.name}</Text>
                <Text style={styles.muted}>
                  {t(roleKeys[member.role])} · {t(statusKeys[member.status])}
                </Text>
                {member.phone ? (
                  <Text style={styles.muted}>{member.phone}</Text>
                ) : null}
              </Pressable>
              <Pressable
                accessibilityLabel={`${t("delete")} ${member.name}`}
                onPress={() =>
                  Alert.alert(t("deleteConfirm"), "", [
                    { text: t("cancel") },
                    {
                      text: t("delete"),
                      style: "destructive",
                      onPress: () => deleteTeamMember(member.id),
                    },
                  ])
                }
                style={{ padding: 10 }}
              >
                <Ionicons
                  name="trash-outline"
                  size={22}
                  color={palette.danger}
                />
              </Pressable>
            </View>
          </Card>
        ))
      ) : (
        <Empty
          icon="👨‍👩‍👧‍👦"
          text={t("emptyTeam")}
          action={t("addMember")}
          onPress={() => setOpen(true)}
        />
      )}
      <Button label={t("addMember")} onPress={() => setOpen(true)} />
      <Card>
        <Text style={styles.label}>{t("shareEventInvite")}</Text>
        <Text style={styles.muted}>{t("shareEventInviteDetail")}</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(["partner", "family", "viewer", "parent"] as TeamMember["role"][]).map((item) => <Button key={item} label={t(roleKeys[item])} onPress={() => setRole(item)} secondary={role !== item} />)}
        </View>
        <Button label={inviteBusy ? t("loading") : t("createInviteLink")} onPress={() => void createInvite()} disabled={inviteBusy} />
        {inviteUrl ? <>
          <View style={{ alignItems: "center", paddingVertical: 12 }}><QRCode value={inviteUrl} size={190} /></View>
          <Text style={styles.muted} selectable>{inviteUrl}</Text>
          <Button label={t("shareInvite")} onPress={() => void Share.share({ message: inviteUrl })} secondary />
        </> : null}
      </Card>
      <Modal visible={open} animationType="slide" onRequestClose={clear}>
        <Screen>
          <Title>{editingId ? t("editMember") : t("addMember")}</Title>
          <Field
            value={name}
            onChangeText={setName}
            placeholder={t("memberName")}
          />
          <Field
            value={phone}
            onChangeText={setPhone}
            placeholder={t("phone")}
            keyboardType="phone-pad"
          />
          <Text style={styles.label}>{t("role")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(roleKeys) as TeamMember["role"][]).map((item) => (
              <Button
                key={item}
                label={t(roleKeys[item])}
                onPress={() => setRole(item)}
                secondary={role !== item}
              />
            ))}
          </View>
          <Text style={styles.label}>{t("status")}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(statusKeys) as TeamMember["status"][]).map((item) => (
              <Button
                key={item}
                label={t(statusKeys[item])}
                onPress={() => setStatus(item)}
                secondary={status !== item}
              />
            ))}
          </View>
          <Button label={t("save")} onPress={submit} />
          <Button label={t("cancel")} onPress={clear} secondary />
        </Screen>
      </Modal>
    </Screen>
  );
}
