import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SystemStatus {
  live_tracking_active: boolean;
  last_analysis_time: string;
  frames_captured: number;
  timestamp: string;
}

interface AnomalyData {
  has_anomaly: boolean;
  report: string;
  timestamp: string | null;
}

interface Notification {
  id: string;
  time: string;
  message: string;
  type: 'anomaly' | 'info';
}

export default function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  // Replace with your LAN IP
  const SERVER_URL = 'http://192.168.1.15:3000';

  // ---- Fetch System Status ----
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/status`);
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.log('Error fetching system status:', error);
    }
  };

  // ---- Fetch Normal Anomalies ----
  const fetchAnomalyData = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/anomalies/latest`);
      if (response.ok) {
        const data: AnomalyData & { success: boolean } = await response.json();
        setAnomalyData(data);

        if (data.success && data.has_anomaly && data.report) {
          addNotification(data.report, data.timestamp);
        }
      }
    } catch (error) {
      console.log('Error fetching anomaly data:', error);
    }
  };

  // ---- Fetch Custom Anomalies ----
  const fetchCustomAnomalies = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/get-custom-anomalies`);
      if (response.ok) {
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          data.forEach((custom: { anomaly: string; timestamp?: string }) => {
            addNotification(custom.anomaly, custom.timestamp, true);
          });
        }
      }
    } catch (error) {
      console.log('Error fetching custom anomalies:', error);
    }
  };

  // ---- Add Notification Helper ----
  const addNotification = (message: string, timestamp?: string | null, isCustom = false) => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      time: timestamp
        ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      type: isCustom ? 'info' : 'anomaly',
    };

    setNotifications((prev) => {
      if (prev.some((n) => n.message === newNotification.message)) return prev; // prevent duplicate
      return [newNotification, ...prev.slice(0, 9)];
    });

    // Show alert popup
    Alert.alert(isCustom ? 'Custom Anomaly Detected!' : 'Anomaly Detected!', message, [
      { text: 'OK' },
    ]);
  };

  // ---- Clear anomaly flag ----
  const clearAnomalyFlag = async () => {
    try {
      await fetch(`${SERVER_URL}/api/anomalies/clear`, { method: 'POST' });
      setAnomalyData((prev) => (prev ? { ...prev, has_anomaly: false } : null));
    } catch (error) {
      console.log('Error clearing anomaly flag:', error);
    }
  };

  // ---- Refresh Handler ----
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSystemStatus(), fetchAnomalyData(), fetchCustomAnomalies()]);
    setRefreshing(false);
  };

  // ---- Effect: Poll every 5s ----
  useEffect(() => {
    fetchSystemStatus();
    fetchAnomalyData();
    fetchCustomAnomalies();

    const interval = setInterval(() => {
      fetchAnomalyData();
      fetchCustomAnomalies();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const renderNotificationItem = (notification: Notification) => (
    <TouchableOpacity key={notification.id} style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <View
          style={[
            styles.iconDot,
            { backgroundColor: notification.type === 'anomaly' ? '#FF1744' : '#00BCD4' },
          ]}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTime}>{notification.time}</Text>
        <Text style={styles.notificationMessage}>{notification.message}</Text>
      </View>
    </TouchableOpacity>
  );

  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00BCD4" />

      {/* Header */}
      <LinearGradient colors={['#00BCD4', '#00ACC1']} style={styles.header}>
        <View style={styles.profileSection}>
          <Image source={require('./assets/girl2.png')} style={styles.profileImage} />
          <Text style={styles.welcomeText}>Welcome Shivoshita Jhalta</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00BCD4']} />}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Good Afternoon, Shivoshita</Text>
        </View>

        {/* CCTV Status Card */}
        <View style={styles.statusCard}>
          <Image source={require('./assets/cctv.png')} style={styles.cctvImage} />
          <Text style={styles.statusTitle}>Check your live analysis' notifications here!</Text>

          {systemStatus && (
            <View style={styles.statusInfo}>
              <Text style={styles.statusText}>
                Status: {systemStatus.live_tracking_active ? 'Active' : 'Inactive'}
              </Text>
              <Text style={styles.statusText}>Frames: {systemStatus.frames_captured}</Text>
            </View>
          )}
        </View>

        {/* Notifications */}
        <View style={styles.notificationsSection}>
          <Text style={styles.sectionTitle}>Live Feed Anomaly Notifications</Text>
          <Text style={styles.sectionSubtitle}>Today, {getCurrentDay()}</Text>

          <View style={styles.notificationsList}>{notifications.map(renderNotificationItem)}</View>
        </View>

        {/* Current Anomaly Alert */}
        {anomalyData?.has_anomaly && (
          <Animated.View style={[styles.anomalyAlert, { opacity: fadeAnim }]}>
            <LinearGradient colors={['#FF5252', '#FF1744']} style={styles.alertGradient}>
              <Text style={styles.alertTitle}>🚨 Active Anomaly Detected</Text>
              <Text style={styles.alertMessage}>{anomalyData.report}</Text>
              <TouchableOpacity style={styles.alertButton} onPress={clearAnomalyFlag}>
                <Text style={styles.alertButtonText}>Acknowledge</Text>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileSection: { alignItems: 'center' },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: 'white',
  },
  welcomeText: { color: 'white', fontSize: 20, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 20 },
  greetingSection: { marginTop: 20, marginBottom: 25 },
  greetingText: { fontSize: 24, fontWeight: '700', color: '#333' },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cctvImage: { width: 120, height: 90, marginBottom: 15, borderRadius: 10 },
  statusTitle: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 10 },
  statusInfo: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
  statusText: { fontSize: 12, color: '#666' },
  notificationsSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5 },
  sectionSubtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  notificationsList: {
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notificationIcon: { marginRight: 15 },
  iconDot: { width: 12, height: 12, borderRadius: 6 },
  notificationContent: { flex: 1 },
  notificationTime: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 2 },
  notificationMessage: { fontSize: 14, color: '#666', lineHeight: 18 },
  anomalyAlert: { marginBottom: 20, borderRadius: 15, overflow: 'hidden' },
  alertGradient: { padding: 20 },
  alertTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  alertMessage: { color: 'white', fontSize: 14, lineHeight: 20, marginBottom: 15 },
  alertButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  alertButtonText: { color: 'white', fontWeight: '600' },
});
