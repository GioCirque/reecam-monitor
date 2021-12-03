export type IPCamRequestOptions = {
  /**
   * Request Method get or post, default: get
   */
  method?: 'get' | 'post';
  /**
   * Request URL, can by parameter, ex.: close_session.cgi?session=1891048766
   */
  url: string;
  /**
   * Request Data, Format is json and auto to encodeURIComponent the data
   */
  data?: Record<string, unknown> | undefined;
  /**
   * Return the raw data parsed from the response. Default: false
   */
  raw?: boolean;
  /**
   * The type of raw data parsed from the response. Default: arraybuffer
   */
  rawType?: 'arraybuffer' | 'stream' | 'blob';
  /**
   * Additional query string parameters
   */
  params?: Record<string, unknown>;
};

export type IPCamOptions = {
  /**
   * The target IP address of the camera
   */
  ip: string;
  /**
   * The friendly name of the camera
   */
  alias: string;
  /**
   * The camera credentials
   */
  credentials: { user: string; pwd: string };
};

export type IPCamStatus = {
  error: number;
  time: number;
  alarm: IPCamAlarmStatus;
  ntp: IPCamNTPStatus;
  record: IPCamRecordStatus;
  disk: IPCamDiskStatus;
  wifi_signal_level: number;
  p2p: number;
  arm: number;
  power: number;
  sessions: number;
  disk_size: number;
  disk_capability: number;
};

export type IPCamProperties = {
  error: number;
  firmware_ver: string;
  max_streams_number: number;
  camera_capability: number;
  flip_min: number;
  flip_max: number;
  flip_default: number;
  h265: number;
};

export type IPCamWifi = {
  ssid: string;
  psk: string;
  discovered: number;
  rssi: number;
  type: number;
  auth: number;
  encrypt: number;
  status: number;
};

export type IPCamRecordSchedule = {
  start: number;
  end: number;
  day: number;
};

export type IPCamParams = {
  error: number;
  id: string;
  id_type: number;
  p2p_id_type: number;
  p2p_svr: string;
  p2p_port: number;
  p2p_id: string;
  p2p_forward_data: number;
  sosocam_id: string;
  alias: string;
  clock: number;
  ntp: number;
  ntp_svr: string;
  tz: number;
  dst: number;
  dst_offset: number;
  user1: string;
  pwd1: string;
  group1: number;
  user2: string;
  pwd2: string;
  group2: number;
  da_defense: number;
  da_retry_times: number;
  da_retry_period: number;
  da_denied_period: number;
  av_schedule: number;
  av_schedule_list: Record<string, unknown>[];
  mac: string;
  dhcp: number;
  ip: string;
  mask: string;
  gateway: string;
  dns1: string;
  dns2: string;
  port: number;
  https: number;
  wifi: number;
  wifi_country: number;
  wifi_ssid: string;
  wifi_type: number;
  wifi_auth: number;
  wifi_encrypt: number;
  wifi_defkey: number;
  wifi_keytype: number;
  wifi_key1: string;
  wifi_key2: string;
  wifi_key3: string;
  wifi_key4: string;
  wifi_wpapsk: string;
  wifi_list: IPCamWifi[];
  telnetd: number;
  stream1_resolution: number;
  stream1_codec: number;
  stream1_bitrate: number;
  stream1_fps: number;
  stream1_gop: number;
  stream1_gop_mode: number;
  stream1_rc: number;
  stream2_resolution: number;
  stream2_codec: number;
  stream2_bitrate: number;
  stream2_fps: number;
  stream2_gop: number;
  stream2_gop_mode: number;
  stream2_rc: number;
  osd: number;
  osd_msg: string;
  osd_pos: number;
  osd_color: number;
  osd_mask: number;
  osd_mask_left: number;
  osd_mask_top: number;
  osd_mask_right: number;
  osd_mask_bottom: number;
  flip: number;
  sensor_direction: number;
  ir: number;
  ir_sensitivity: number;
  ir2_on_threshold: number;
  ir2_off_threshold: number;
  ir_saturation_correction: number;
  spk_volume: number;
  mic_volume: number;
  language: number;
  md_armed: number;
  md_win1_valid: number;
  md_win1_left: number;
  md_win1_top: number;
  md_win1_right: number;
  md_win1_bottom: number;
  md_win2_valid: number;
  md_win2_left: number;
  md_win2_top: number;
  md_win2_right: number;
  md_win2_bottom: number;
  md_win3_valid: number;
  md_win3_left: number;
  md_win3_top: number;
  md_win3_right: number;
  md_win3_bottom: number;
  md_sensitivity: number;
  md_mode: number;
  sd_armed: number;
  sd_sensitivity: number;
  sd_threshold_base: number;
  sd_threshold_step: number;
  arm_schedule: number;
  arm_schedule_list: Record<string, unknown>[];
  arm_delay: number;
  alarm_sound: number;
  alarm_preset: number;
  alarm_period: number;
  sosocam_url: string;
  push_language: number;
  record: number;
  record_schedule_list: IPCamRecordSchedule[];
  alarm_record_time: number;
  record_stream: number;
  comm: number;
  comm_baud: number;
  comm_data_bits: number;
  comm_stop_bits: number;
  comm_parity: number;
  comm_flow_control: number;
  led: number;
  pt_rate: number;
  t_patrol_rate: number;
  p_patrol_rate: number;
  track_patrol_rate: number;
  preset1: number;
  preset2: number;
  preset3: number;
  preset4: number;
  preset5: number;
  preset6: number;
  preset7: number;
  preset8: number;
  preset9: number;
  preset10: number;
  preset11: number;
  preset12: number;
  preset13: number;
  preset14: number;
  preset15: number;
  preset16: number;
  preset17: number;
  preset18: number;
  preset19: number;
  preset20: number;
  preset21: number;
  preset22: number;
  preset23: number;
  preset24: number;
  preset25: number;
  preset26: number;
  preset27: number;
  preset28: number;
  preset29: number;
  preset30: number;
  preset31: number;
  preset32: number;
  track_node1_preset: number;
  track_node1_stay: number;
  track_node2_preset: number;
  track_node2_stay: number;
  track_node3_preset: number;
  track_node3_stay: number;
  track_node4_preset: number;
  track_node4_stay: number;
  track_node5_preset: number;
  track_node5_stay: number;
  track_node6_preset: number;
  track_node6_stay: number;
  track_node7_preset: number;
  track_node7_stay: number;
  track_node8_preset: number;
  track_node8_stay: number;
  track_node9_preset: number;
  track_node9_stay: number;
  track_node10_preset: number;
  track_node10_stay: number;
  track_node11_preset: number;
  track_node11_stay: number;
  track_node12_preset: number;
  track_node12_stay: number;
  track_node13_preset: number;
  track_node13_stay: number;
  track_node14_preset: number;
  track_node14_stay: number;
  track_node15_preset: number;
  track_node15_stay: number;
  track_node16_preset: number;
  track_node16_stay: number;
  patrol_schedule: number;
  patrol_schedule_list: Record<string, unknown>[];
  boot_preset: number;
  sender: string;
  receiver1: string;
  receiver2: string;
  receiver3: string;
  receiver4: string;
  smtp_svr: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pwd: string;
  smtp_auth: number;
  smtp_tls: number;
  test_mail_subject: string;
  test_mail_body: string;
  alarm_mail_subject: string;
  alarm_mail_body: string;
  alarm_mail: number;
  zmid_id: number;
  zmid_quality: number;
};

export type IPCamSearchRecord = {
  name: string;
  seq: number;
  flag: number;
  start_time: Date;
  end_time: Date;
  size: number;
};

export type IPCamSearchResults = {
  error: number;
  result: number;
  record: IPCamSearchRecord[];
};

export type IPCamConfig = {
  alias: string;
  clock: number;
  tz: number;
  pwd1: string;
  wifi: number;
  wifi_ssid: string;
  wifi_auth: number;
  wifi_encrypt: number;
  wifi_wpapsk: string;
  wifi_list: IPCamWifi[];
  stream1_resolution: number;
  stream2_resolution: number;
  flip: number;
  ir: number;
  arm_schedule: number;
  record_schedule_list: IPCamRecordSchedule[];
};

export type IPCamBadAuth = {
  error: number;
  da_defense: number;
  retry_times: number;
  error_times: number;
  denied_time_total: number;
  denied_time_passed: number;
};

export enum IPCamAlarmStatus {
  NO_ALARM = 0,
  MOTION_DETECTION_ALARM = 1,
  EXTERNAL_ALARM = 2,
  AUDIO_DETECTION_ALARM = 3,
}

export enum IPCamUPNPStatus {
  NO_ACTION = 0,
  UPNP_SUCCESS = 1,
  IGD_DEVICE_NOT_FOUND = -1,
  INVALID_IGD_DEVICE = -2,
  UPNP_OPERATION_FAILED = -3,
}

export enum IPCamNTPStatus {
  NO_ACTION = 0,
  NTP_SUCCESSFULLY = 1,
  NTP_FAILS = 2,
}

export enum IPCamRecordStatus {
  NOT_VIDEO = 0,
  CURRENT_VIDEO = 1,
}

export enum IPCamDiskStatus {
  NOT_DETECTED_DISK = 0,
  DISK_ERROR = -1,
  INSUFFICIENT_DISK_SPACE = -2,
  PERCENTAGE_OF_DISK_SPACE_LEFT,
}

export enum IPCamLogEvent {
  /**
   * System - Device starts
   */
  SYSTEM_DEVICE_STARTS = 0x00000,

  /**
   * System - HTTPS error
   */
  SYSTEM_HTTPS_ERROR = 0x00001,

  /**
   * System - Disk space is full
   */
  SYSTEM_DISK_SPACE_IS_FULL = 0x00002,

  /**
   * System - Disk error
   */
  SYSTEM_DISK_ERROR = 0x00003,

  /**
   * User - Authorized users to access
   */
  USER_AUTHORIZED_USERS_TO_ACCESS = 0x10000,

  /**
   * User - Deny users access
   */
  USER_DENY_USERS_ACCESS = 0x10001,

  /**
   * User - Visit reject Session
   */
  USER_VISIT_REJECT_SESSION = 0x10002,

  /**
   * User - Users to create Session
   */
  USER_USERS_TO_CREATE_SESSION = 0x10003,

  /**
   * User - The user end of the Session
   */
  USER_THE_USER_END_OF_THE_SESSION = 0x10004,

  /**
   * User - Session terminated by equipment
   */
  USER_SESSION_TERMINATED_BY_EQUIPMENT = 0x10005,

  /**
   * Mail - Send mail to success
   */
  MAIL_SEND_MAIL_TO_SUCCESS = 0x20000,

  /**
   * Mail - Send e-mail failed: system error
   */
  MAIL_SEND_EMAIL_FAILED_SYSTEM_ERROR = 0x20001,

  /**
   * Mail - Failed to send a message: parameter error
   */
  MAIL_FAILED_TO_SEND_A_MESSAGE_PARAMETER_ERROR = 0x20002,

  /**
   * Mail - Send message failed: Can not connect to the server
   */
  MAIL_SEND_MESSAGE_FAILED_CAN_NOT_CONNECT_TO_THE_SERVER = 0x20003,

  /**
   * Mail - Send e-mail failure: STARTTLS failed
   */
  MAIL_SEND_EMAIL_FAILURE_STARTTLS_FAILED = 0x20004,

  /**
   * Mail - Send e-mail fails: TLS fails
   */
  MAIL_SEND_EMAIL_FAILS_TLS_FAILS = 0x20005,

  /**
   * Mail - Send message failed: server error
   */
  MAIL_SEND_MESSAGE_FAILED_SERVER_ERROR = 0x20006,

  /**
   * Mail - Send mail failed: authentication method is not supported
   */
  MAIL_SEND_MAIL_FAILED_AUTHENTICATION_METHOD_IS_NOT_SUPPORTED = 0x20007,

  /**
   * Mail - Send Mail failed: user authentication failed
   */
  MAIL_SEND_MAIL_FAILED_USER_AUTHENTICATION_FAILED = 0x20008,

  /**
   * Mail - Send e-mail fails: the mail is rejected
   */
  MAIL_SEND_EMAIL_FAILS_THE_MAIL_IS_REJECTED = 0x20009,

  /**
   * Alarm - Alarm stop
   */
  ALARM_ALARM_STOP = 0x30000,

  /**
   * Alarm - Motion detection alarm
   */
  ALARM_MOTION_DETECTION_ALARM = 0x30001,

  /**
   * Alarm - External alarm
   */
  ALARM_EXTERNAL_ALARM = 0x30002,

  /**
   * Alarm - Sound detection alarm
   */
  ALARM_SOUND_DETECTION_ALARM = 0x30003,

  /**
   * Alarm - Alarm action fails
   */
  ALARM_ALARM_ACTION_FAILS = 0x30004,
}

export type IPCamLogEntry = {
  event: string | IPCamLogEvent;
  t: number | Date;
  user: string;
  ip: string;
};

export type IPCamLogResult = {
  error: number;
  log: IPCamLogEntry[];
};
