import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ChevronDown,
  LayoutGrid,
  Stethoscope,
  FlaskConical,
  Users,
  Building2,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  X,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  Menu,
  Info,
  CheckCircle2,
  Send,
  Clock,
  Video,
  Copy,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { Department } from '../../types';

interface LandingPageProps {
  onLogin: () => void;
  onAssignWork?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const { currentUser, departments: contextDepartments } = useApp();
  const [liveDepartments, setLiveDepartments] = useState<Department[]>([]);

  const fetchLiveDepartments = async () => {
    try {
      const data = await api.getDepartments();
      if (Array.isArray(data)) {
        setLiveDepartments(data);
      }
    } catch (err) {
      console.warn('Notice loading live departments:', err);
    }
  };

  useEffect(() => {
    fetchLiveDepartments();
    const interval = setInterval(fetchLiveDepartments, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contextDepartments && contextDepartments.length > 0) {
      setLiveDepartments(contextDepartments);
    }
  }, [contextDepartments]);
  const [activeCategory, setActiveCategory] = useState<'overview' | 'departments' | 'requests' | 'appointments' | 'about'>('departments');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const isOverTriggerRef = useRef(false);
  const isOverMenuRef = useRef(false);
  const megaMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelCloseTimer = () => {
    if (megaMenuTimeoutRef.current) {
      clearTimeout(megaMenuTimeoutRef.current);
      megaMenuTimeoutRef.current = null;
    }
  };

  const scheduleClose = (delay = 200) => {
    cancelCloseTimer();
    megaMenuTimeoutRef.current = setTimeout(() => {
      if (!isOverTriggerRef.current && !isOverMenuRef.current) {
        setMegaMenuOpen(false);
      }
    }, delay);
  };

  const handleTriggerEnter = () => {
    isOverTriggerRef.current = true;
    cancelCloseTimer();
    setActiveCategory('departments');
    setMegaMenuOpen(true);
  };

  const handleTriggerLeave = () => {
    isOverTriggerRef.current = false;
    scheduleClose(350);
  };

  const handleMenuEnter = () => {
    isOverMenuRef.current = true;
    cancelCloseTimer();
    setMegaMenuOpen(true);
  };

  const handleMenuLeave = () => {
    isOverMenuRef.current = false;
    scheduleClose(180);
  };

  const handleOtherNavHover = () => {
    isOverTriggerRef.current = false;
    isOverMenuRef.current = false;
    cancelCloseTimer();
    setMegaMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      cancelCloseTimer();
    };
  }, []);
  const [selectedDeptInfo, setSelectedDeptInfo] = useState<{ title: string; desc: string; icon: any } | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDeptAccordion, setMobileDeptAccordion] = useState(false);

  // Work Request State (Chip style popup & direct submission without login)
  const [workRequestDropdownOpen, setWorkRequestDropdownOpen] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState<{
    id: string;
    title: string;
    desc: string;
    icon: any;
    color: string;
    badge: string;
  } | null>(null);
  const [requestFormSubmitted, setRequestFormSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Work Request Form Fields
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqDepartment, setReqDepartment] = useState('Clinical Departments');
  const [reqSubject, setReqSubject] = useState('');
  const [reqDate, setReqDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [reqTimeSlot, setReqTimeSlot] = useState('Morning (10:00 AM - 12:00 PM)');
  const [reqDetails, setReqDetails] = useState('');
  const [reqPriority, setReqPriority] = useState<'Normal' | 'Urgent' | 'Low'>('Normal');

  // Meeting Form Specific State (Playfair / Inter ivory-to-sage specification)
  const [meetingType, setMeetingType] = useState<'one-to-one' | 'one-to-many'>('one-to-one');
  const [meetingSenderName, setMeetingSenderName] = useState('');
  const [meetingSenderEmail, setMeetingSenderEmail] = useState('');
  const [meetingSenderNumber, setMeetingSenderNumber] = useState('');
  const [meetingReceiverName, setMeetingReceiverName] = useState('');
  const [meetingReceiverEmail, setMeetingReceiverEmail] = useState('');
  const [meetingReceiverNumber, setMeetingReceiverNumber] = useState('');
  const [selectedGroupReceivers, setSelectedGroupReceivers] = useState<any[]>([]);
  const [meetingMode, setMeetingMode] = useState<'Online' | 'Offline'>('Online');
  const [meetingPlace, setMeetingPlace] = useState('');
  const [meetingTime, setMeetingTime] = useState('10:00 AM');
  const [meetingPurpose, setMeetingPurpose] = useState('');
  const [createdJoinUrl, setCreatedJoinUrl] = useState('');

  // Auto-fill sender if user is logged in
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name) setMeetingSenderName(currentUser.name);
      if (currentUser.email) setMeetingSenderEmail(currentUser.email);
      if ((currentUser as any).phone) setMeetingSenderNumber((currentUser as any).phone);
    }
  }, [currentUser]);

  const handleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validate Sender Details & Number
    if (!meetingSenderName.trim() || !meetingSenderEmail.trim()) {
      alert('Please enter Sender Name and Sender Email ID.');
      return;
    }
    if (!emailRegex.test(meetingSenderEmail.trim())) {
      alert('Please enter a valid Sender Email ID.');
      return;
    }
    const cleanSenderNum = meetingSenderNumber.replace(/\D/g, '');
    if (!cleanSenderNum || cleanSenderNum.length < 10) {
      alert('Please enter a valid Sender Number (at least 10 digits).');
      return;
    }

    // 1b. Validate Receiver Details & Number
    if (meetingType === 'one-to-one') {
      if (!meetingReceiverName.trim() || !meetingReceiverEmail.trim()) {
        alert('Please enter Receiver Name and Receiver Email ID.');
        return;
      }
      if (!emailRegex.test(meetingReceiverEmail.trim())) {
        alert('Please enter a valid Receiver Email ID.');
        return;
      }
      const cleanReceiverNum = meetingReceiverNumber.replace(/\D/g, '');
      if (!cleanReceiverNum || cleanReceiverNum.length < 10) {
        alert('Please enter a valid Receiver Number (at least 10 digits).');
        return;
      }
    } else {
      if (selectedGroupReceivers.length === 0 && (!meetingReceiverName.trim() || !meetingReceiverEmail.trim())) {
        alert('Please enter at least one participant (Name and Email ID) for the group meeting.');
        return;
      }
      if (meetingReceiverEmail.trim()) {
        if (!emailRegex.test(meetingReceiverEmail.trim())) {
          alert('Please enter a valid Receiver Email ID.');
          return;
        }
        const cleanReceiverNum = meetingReceiverNumber.replace(/\D/g, '');
        if (!cleanReceiverNum || cleanReceiverNum.length < 10) {
          alert('Please enter a valid Receiver Number (at least 10 digits).');
          return;
        }
      }
    }

    // 2. Verify Receiver Email ID against registered users in the backend
    const emailToVerify = meetingReceiverEmail.trim() || (selectedGroupReceivers.length > 0 ? selectedGroupReceivers[0].email : '');
    setIsSubmitting(true);

    try {
      const verifyRes = await api.verifyReceiverEmail(emailToVerify);
      if (!verifyRes.exists) {
        // 3. If receiver email is not registered: show message, preserve entries, stop submission
        alert('Invalid receiver email. Enter the email address of a registered user.');
        setIsSubmitting(false);
        return;
      }

      // 4. Verification succeeds: save request with unique reference ID and matched receiver's account ID
      const matchedReceiverId = verifyRes.user?.id || verifyRes.user?.userId || emailToVerify;
      const newRef = `MEET-${meetingMode.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const participantsList: Array<{ id: string; name: string; email: string; phone?: string; role: string; }> = [
        { id: currentUser?.id || meetingSenderEmail, name: meetingSenderName, email: meetingSenderEmail, phone: meetingSenderNumber, role: 'host' }
      ];

      if (meetingType === 'one-to-many') {
        if (selectedGroupReceivers.length > 0) {
          selectedGroupReceivers.forEach(r => {
            participantsList.push({ id: r.id || r.email, name: r.name, email: r.email, phone: r.phone || '', role: 'attendee' });
          });
        }
        if (meetingReceiverEmail.trim() && !participantsList.some(p => p.email.toLowerCase() === meetingReceiverEmail.trim().toLowerCase())) {
          participantsList.push({
            id: matchedReceiverId,
            name: meetingReceiverName || 'Participant',
            email: meetingReceiverEmail,
            phone: meetingReceiverNumber,
            role: 'attendee'
          });
        }
      } else {
        participantsList.push({
          id: matchedReceiverId,
          name: meetingReceiverName || 'Participant',
          email: meetingReceiverEmail,
          phone: meetingReceiverNumber,
          role: 'attendee'
        });
      }

      const participantEmailsList = participantsList.map(p => (p.email || '').toLowerCase().trim());
      const effectiveReceiverName = meetingReceiverName || (selectedGroupReceivers.length > 0 ? selectedGroupReceivers[0].name : 'Administration Office');
      const effectiveReceiverEmail = meetingReceiverEmail || (selectedGroupReceivers.length > 0 ? selectedGroupReceivers[0].email : '');
      const effectiveReceiverNumber = meetingReceiverNumber || (selectedGroupReceivers.length > 0 ? (selectedGroupReceivers[0].phone || '') : '');

      const res = await api.createMeeting({
        title: `Meeting: ${meetingPurpose ? (meetingPurpose.length > 35 ? meetingPurpose.substring(0, 35) + '...' : meetingPurpose) : (effectiveReceiverName ? `Meeting with ${effectiveReceiverName}` : 'Video Meeting')}`,
        type: meetingType,
        referenceId: newRef,
        formType: 'Meeting',
        senderId: currentUser?.id || meetingSenderEmail,
        senderName: meetingSenderName,
        senderEmail: meetingSenderEmail,
        senderNumber: meetingSenderNumber,
        receiverId: matchedReceiverId,
        receiverName: effectiveReceiverName,
        receiverEmail: effectiveReceiverEmail,
        receiverNumber: effectiveReceiverNumber,
        participants: participantsList,
        participantEmails: participantEmailsList,
        date: reqDate,
        time: meetingTime || '10:00 AM',
        mode: meetingMode,
        location: meetingMode === 'Online' ? '' : (meetingPlace || 'Main Conference Hall'),
        purpose: `${meetingPurpose}${meetingSenderNumber ? `\nSender Number: ${meetingSenderNumber}` : ''}${effectiveReceiverNumber ? `\nReceiver Number: ${effectiveReceiverNumber}` : ''}`,
        requiresApproval: false,
        agreedToNotifications: true
      });

      if (res && res.joinUrl) {
        setCreatedJoinUrl(res.joinUrl);
      }

      // 5. Send WhatsApp messages via WPPConnect (fail-safe delivery)
      api.sendWppNotifications({
        formType: 'Meeting',
        referenceId: newRef,
        senderName: meetingSenderName,
        senderNumber: meetingSenderNumber,
        receiverName: effectiveReceiverName,
        receiverNumber: effectiveReceiverNumber,
        agreedToNotifications: true
      }).catch(err => console.warn('WPP notification trigger notice:', err));

      setReferenceId(newRef);
      setRequestFormSubmitted(true);
    } catch (err) {
      console.warn('Meeting creation warning:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Event Organize Specific State (Matching Event Playfair / Inter ivory-to-sage specification)
  const [eventSenderName, setEventSenderName] = useState('');
  const [eventSenderEmail, setEventSenderEmail] = useState('');
  const [eventSenderNumber, setEventSenderNumber] = useState('');
  const [eventReceiverName, setEventReceiverName] = useState('');
  const [eventReceiverEmail, setEventReceiverEmail] = useState('');
  const [eventReceiverNumber, setEventReceiverNumber] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [eventDepartment, setEventDepartment] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventPurpose, setEventPurpose] = useState('');

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Validate both numbers and input fields
    if (!eventSenderName.trim()) {
      alert('Please enter Sender Name.');
      return;
    }
    if (!emailRegex.test(eventSenderEmail.trim())) {
      alert('Please enter a valid Sender Email ID.');
      return;
    }
    const cleanSenderNum = eventSenderNumber.replace(/\D/g, '');
    if (!cleanSenderNum || cleanSenderNum.length < 10) {
      alert('Please enter a valid Sender Number (at least 10 digits).');
      return;
    }

    if (!eventReceiverName.trim()) {
      alert('Please enter Receiver Name.');
      return;
    }
    if (!emailRegex.test(eventReceiverEmail.trim())) {
      alert('Please enter a valid Receiver Email ID.');
      return;
    }
    const cleanReceiverNum = eventReceiverNumber.replace(/\D/g, '');
    if (!cleanReceiverNum || cleanReceiverNum.length < 10) {
      alert('Please enter a valid Receiver Number (at least 10 digits).');
      return;
    }

    if (!eventTitle.trim()) {
      alert('Please enter Title of Event.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Verify Receiver Email ID against registered users in the backend
      const verifyRes = await api.verifyReceiverEmail(eventReceiverEmail.trim());
      if (!verifyRes.exists) {
        // 3. Show error message, preserve form entries, and stop submission
        alert('Invalid receiver email. Enter the email address of a registered user.');
        setIsSubmitting(false);
        return;
      }

      // 4. Save request with unique reference ID and matched receiver's account ID
      const matchedReceiverId = verifyRes.user?.id || verifyRes.user?.userId || eventReceiverEmail.trim();
      const newRef = `EVT-ORG-${Math.floor(1000 + Math.random() * 9000)}`;

      await api.createAppointment({
        referenceId: newRef,
        formType: 'Event Organize',
        title: `Event: ${eventTitle}`,
        requestedBy: `${eventSenderName} (${eventSenderEmail}${eventSenderNumber ? ` • ${eventSenderNumber}` : ''})`,
        senderName: eventSenderName,
        senderEmail: eventSenderEmail,
        senderNumber: eventSenderNumber,
        receiverId: matchedReceiverId,
        receiverName: eventReceiverName,
        receiverEmail: eventReceiverEmail,
        receiverNumber: eventReceiverNumber,
        department: eventDepartment || 'Institutional Events',
        team: eventReceiverName ? `To: ${eventReceiverName}` : 'Administration Office',
        date: reqDate,
        time: eventTime || '10:00 AM',
        dateTimeDisplay: `${reqDate} • ${eventTime || 'TBD'}`,
        location: 'Campus Auditorium / Conference Hall',
        purpose: `[Event Organize Request]\nTitle: ${eventTitle}\nDepartment: ${eventDepartment}\nSender: ${eventSenderName} (${eventSenderEmail}${eventSenderNumber ? `, Phone: ${eventSenderNumber}` : ''})\nReceiver: ${eventReceiverName} (${eventReceiverEmail}${eventReceiverNumber ? `, Phone: ${eventReceiverNumber}` : ''})\n\nPurpose / Description:\n${eventPurpose}`,
        status: 'Scheduled',
        agreedToNotifications: true
      });

      // 5. Send WhatsApp notifications via WPPConnect (fail-safe delivery)
      api.sendWppNotifications({
        formType: 'Event Organize',
        referenceId: newRef,
        senderName: eventSenderName,
        senderNumber: eventSenderNumber,
        receiverName: eventReceiverName,
        receiverNumber: eventReceiverNumber,
        agreedToNotifications: true
      }).catch(err => console.warn('WPP notification trigger notice:', err));

      setReferenceId(newRef);
      setRequestFormSubmitted(true);
    } catch (err) {
      console.warn('API submission fallback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // General Information Specific State (Matching General Information Specification)
  const [infoSenderName, setInfoSenderName] = useState('');
  const [infoSenderEmail, setInfoSenderEmail] = useState('');
  const [infoSenderNumber, setInfoSenderNumber] = useState('');
  const [infoReceiverName, setInfoReceiverName] = useState('');
  const [infoReceiverEmail, setInfoReceiverEmail] = useState('');
  const [infoReceiverNumber, setInfoReceiverNumber] = useState('');
  const [infoSubject, setInfoSubject] = useState('');
  const [infoDepartment, setInfoDepartment] = useState('');
  const [infoDescription, setInfoDescription] = useState('');

  // Field-level error messages displayed beside labels
  const [infoErrors, setInfoErrors] = useState<{
    senderName?: string;
    senderEmail?: string;
    senderNumber?: string;
    receiverName?: string;
    receiverEmail?: string;
    receiverNumber?: string;
    subject?: string;
  }>({});

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errors: typeof infoErrors = {};

    // 1. Validate both numbers and input fields
    if (!infoSenderName.trim()) {
      errors.senderName = 'Sender Name is required';
    }
    if (!infoSenderEmail.trim()) {
      errors.senderEmail = 'Sender Email is required';
    } else if (!emailRegex.test(infoSenderEmail.trim())) {
      errors.senderEmail = 'Invalid email address';
    }
    const cleanSenderNum = infoSenderNumber.replace(/\D/g, '');
    if (!cleanSenderNum || cleanSenderNum.length < 10) {
      errors.senderNumber = 'Valid 10-digit number required';
    }

    if (!infoReceiverName.trim()) {
      errors.receiverName = 'Receiver Name is required';
    }
    if (!infoReceiverEmail.trim()) {
      errors.receiverEmail = 'Receiver Email is required';
    } else if (!emailRegex.test(infoReceiverEmail.trim())) {
      errors.receiverEmail = 'Invalid email address';
    }
    const cleanReceiverNum = infoReceiverNumber.replace(/\D/g, '');
    if (!cleanReceiverNum || cleanReceiverNum.length < 10) {
      errors.receiverNumber = 'Valid 10-digit number required';
    }

    if (!infoSubject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (Object.keys(errors).length > 0) {
      setInfoErrors(errors);
      if (errors.senderNumber || errors.receiverNumber) {
        alert('Please enter valid 10-digit numbers for both Sender Number and Receiver Number.');
      }
      return;
    }
    setInfoErrors({});

    setIsSubmitting(true);

    try {
      // 2. Verify Receiver Email ID against registered users in the backend
      const verifyRes = await api.verifyReceiverEmail(infoReceiverEmail.trim());
      if (!verifyRes.exists) {
        // 3. Show error message, preserve form entries, and stop submission
        setInfoErrors({ receiverEmail: 'Invalid receiver email. Enter the email address of a registered user.' });
        alert('Invalid receiver email. Enter the email address of a registered user.');
        setIsSubmitting(false);
        return;
      }

      // 4. Save request with unique reference ID and matched receiver's account ID
      const matchedReceiverId = verifyRes.user?.id || verifyRes.user?.userId || infoReceiverEmail.trim();
      const newRef = `GEN-INF-${Math.floor(1000 + Math.random() * 9000)}`;

      await api.createAppointment({
        referenceId: newRef,
        formType: 'General Information',
        title: infoSubject.trim() || `General Info from ${infoSenderName}`,
        requestedBy: `${infoSenderName} (${infoSenderEmail}${infoSenderNumber ? ` • ${infoSenderNumber}` : ''})`,
        senderName: infoSenderName,
        senderEmail: infoSenderEmail,
        senderNumber: infoSenderNumber,
        receiverId: matchedReceiverId,
        receiverName: infoReceiverName,
        receiverEmail: infoReceiverEmail,
        receiverNumber: infoReceiverNumber,
        department: infoDepartment.trim() || 'General Information',
        team: infoReceiverName ? `To: ${infoReceiverName} (${infoReceiverEmail})` : 'Administration Office',
        date: reqDate,
        time: '10:00 AM',
        dateTimeDisplay: `${reqDate} • General Info`,
        location: 'Office of Administration',
        purpose: `[General Information Request]\nSubject: ${infoSubject}\nDepartment: ${infoDepartment || 'Not specified'}\nSender: ${infoSenderName} (${infoSenderEmail}${infoSenderNumber ? `, Phone: ${infoSenderNumber}` : ''})\nReceiver: ${infoReceiverName} (${infoReceiverEmail}${infoReceiverNumber ? `, Phone: ${infoReceiverNumber}` : ''})\n\nDescription:\n${infoDescription || 'No description provided.'}`,
        status: 'Scheduled',
        agreedToNotifications: true
      });

      // 5. Send WhatsApp notifications via WPPConnect (fail-safe delivery)
      api.sendWppNotifications({
        formType: 'General Information',
        referenceId: newRef,
        senderName: infoSenderName,
        senderNumber: infoSenderNumber,
        receiverName: infoReceiverName,
        receiverNumber: infoReceiverNumber,
        agreedToNotifications: true
      }).catch(err => console.warn('WPP notification trigger notice:', err));

      setReferenceId(newRef);
      setRequestFormSubmitted(true);
    } catch (err) {
      console.warn('API submission fallback:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Work Request Categories matching user's chip reference screenshot verbatim
  const requestTypes = [
    {
      id: 'meeting',
      title: 'Meeting',
      desc: 'Request a meeting with Administration',
      icon: Users,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'Meeting Request'
    },
    {
      id: 'event',
      title: 'Event',
      desc: 'Invite to an event or programme',
      icon: Calendar,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'Event Invitation'
    },
    {
      id: 'general-info',
      title: 'General Information',
      desc: 'Share information with the office',
      icon: Info,
      color: 'bg-emerald-50 text-[#00a884] border-emerald-100',
      badge: 'General Information'
    }
  ];

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqEmail.trim()) {
      alert('Please enter your Name and Email address.');
      return;
    }

    setIsSubmitting(true);
    const newRef = `WKH-REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api.createAppointment({
        title: reqSubject.trim() || `${selectedRequestType?.title || 'Work'} Request from ${reqName}`,
        requestedBy: `${reqName} (${reqEmail}${reqPhone ? ` • ${reqPhone}` : ''})`,
        department: reqDepartment,
        team: selectedRequestType?.title || "Administration Office",
        date: reqDate,
        time: reqTimeSlot.split(' ')[0] || '10:00 AM',
        dateTimeDisplay: `${reqDate} • ${reqTimeSlot}`,
        purpose: `${selectedRequestType?.desc || ''}\n\nDetails: ${reqDetails || 'No additional details provided.'}\nPriority: ${reqPriority}`,
        status: 'Scheduled'
      });
    } catch (err) {
      console.warn('API submission fallback:', err);
    } finally {
      setIsSubmitting(false);
      setReferenceId(newRef);
      setRequestFormSubmitted(true);
    }
  };

  const resetRequestForm = () => {
    setSelectedRequestType(null);
    setRequestFormSubmitted(false);
    setReqName('');
    setReqEmail('');
    setReqPhone('');
    setReqSubject('');
    setReqDetails('');
    setReferenceId('');
    setMeetingSenderName(currentUser?.name || '');
    setMeetingSenderEmail(currentUser?.email || '');
    setMeetingSenderNumber((currentUser as any)?.phone || '');
    setMeetingReceiverName('');
    setMeetingReceiverEmail('');
    setMeetingReceiverNumber('');
    setSelectedGroupReceivers([]);
    setCreatedJoinUrl('');
    setMeetingPlace('');
    setMeetingTime('10:00 AM');
    setMeetingPurpose('');
    setEventSenderName('');
    setEventSenderEmail('');
    setEventSenderNumber('');
    setEventReceiverName('');
    setEventReceiverEmail('');
    setEventReceiverNumber('');
    setEventTitle('');
    setEventDepartment('');
    setEventTime('');
    setEventPurpose('');
    setInfoSenderName('');
    setInfoSenderEmail('');
    setInfoSenderNumber('');
    setInfoReceiverName('');
    setInfoReceiverEmail('');
    setInfoReceiverNumber('');
    setInfoSubject('');
    setInfoDepartment('');
    setInfoDescription('');
    setInfoErrors({});
  };

  // Department Icon Mapper supporting string names or React elements
  const getDeptIcon = (iconName: any): React.ElementType => {
    if (typeof iconName === 'function') return iconName;
    if (iconName && typeof iconName === 'object' && 'render' in iconName) return iconName;
    const name = String(iconName || '').toLowerCase();
    switch (name) {
      case 'code':
        return LayoutGrid;
      case 'palette':
        return Sparkles;
      case 'megaphone':
        return MessageSquare;
      case 'stethoscope':
      case 'clinical':
        return Stethoscope;
      case 'flask':
      case 'diagnostics':
        return FlaskConical;
      case 'calendar':
        return Calendar;
      case 'shield':
        return ShieldCheck;
      case 'users':
        return Users;
      case 'layers':
      case 'hospital':
      default:
        return Building2;
    }
  };

  const fallbackCol1 = [
    { id: 'clinical', name: 'Clinical Medicine & Outpatient', icon: 'stethoscope', description: 'Inpatient & outpatient clinical care, surgical specialties & emergency medicine.' },
    { id: 'emergency', name: 'Emergency & Trauma Services', icon: 'stethoscope', description: '24/7 acute trauma stabilization, emergency triage and critical ambulance response.' },
    { id: 'surgery', name: 'General Surgery & Critical Care', icon: 'stethoscope', description: 'Advanced surgical suites, intensive care coordination and post-op care.' },
    { id: 'pediatrics', name: 'Pediatrics & Maternal Health', icon: 'stethoscope', description: 'Specialized neonatal care, pediatric medicine and maternal wellness.' },
  ];

  const fallbackCol2 = [
    { id: 'pathology', name: 'Pathology & Microbiology Labs', icon: 'flask', description: 'Comprehensive diagnostic pathology, histology, microbiology cultures and automated analysis.' },
    { id: 'radiology', name: 'Radiology & Advanced Imaging', icon: 'flask', description: 'Digital X-ray, multi-slice CT, 3T MRI, ultrasound and interventional radiology services.' },
    { id: 'biochem', name: 'Clinical Biochemistry Diagnostics', icon: 'flask', description: 'High-throughput automated clinical biochemistry, hormone assays and toxicology screening.' },
    { id: 'digital-ai', name: 'Digital AI & Health Informatics', icon: 'code', description: 'Institutional artificial intelligence, health informatics and electronic health record integration.' },
  ];

  const hasLiveDepts = liveDepartments.length > 0;
  const col1Depts = hasLiveDepts
    ? (liveDepartments.length > 4 ? liveDepartments.slice(0, Math.ceil(liveDepartments.length / 2)) : liveDepartments)
    : fallbackCol1;

  const col2Depts = hasLiveDepts && liveDepartments.length > 4
    ? liveDepartments.slice(Math.ceil(liveDepartments.length / 2))
    : fallbackCol2;

  const allAvailableDepts = hasLiveDepts ? liveDepartments : [...fallbackCol1, ...fallbackCol2];

  const handleDeptClick = (dept: { id?: string; name?: string; title?: string; description?: string; desc?: string; icon?: any }) => {
    const title = dept.name || dept.title || 'Department';
    const desc = dept.description || dept.desc || 'Department workspace, assigned teams and member roster.';
    const icon = getDeptIcon(dept.icon || dept.name || dept.title);
    setSelectedDeptInfo({ title, desc, icon });
    setMegaMenuOpen(false);
  };

  return (
    <div
      className="min-h-screen text-gray-900 font-sans selection:bg-[#5a36e6] selection:text-white flex flex-col justify-between relative overflow-x-hidden bg-cover bg-center bg-no-repeat transition-all duration-300"
      style={{
        backgroundImage: `url('/landing-bg.jpg')`
      }}
    >
      {/* Subtle edge-to-edge ambient filter so the full architectural campus covers the webpage */}
      <div className="absolute inset-0 bg-slate-900/[0.04] backdrop-contrast-[1.01] pointer-events-none z-0" />

      {/* ---------------- TOP NAVIGATION BAR & MEGA-MENU WRAPPER ---------------- */}
      <div
        className="sticky top-0 z-50 w-full"
        onMouseLeave={handleMenuLeave}
      >
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200/50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">

          {/* Left Brand Logo & Title */}
          <div className="flex items-center gap-3 sm:gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            {/* Custom Green Leaf Brand Icon from screenshot */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 sm:w-9 sm:h-9">
                <path d="M12 28C10 20 18 10 28 8C26 18 18 28 12 28Z" fill="#22c55e" />
                <path d="M12 28C16 28 22 22 28 8C18 10 10 20 12 28Z" fill="#15803d" />
                <path d="M14 26C18 20 22 14 28 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-gray-950 tracking-tight leading-none">WorkHub</h1>
              <p className="text-[10px] sm:text-[11px] font-medium text-gray-500 tracking-wide mt-0.5">Team Workspace</p>
            </div>

            {/* Vertical separator | */}
            <div className="hidden sm:block h-7 w-px bg-gray-300/80 ml-2" />
          </div>

          {/* Center Category Navigation Links (Categories in Figma Diagram) */}
          <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100/80 p-1.5 rounded-full border border-gray-200/60 shadow-2xs">
            <button
              onClick={() => {
                setActiveCategory('overview');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onMouseEnter={handleOtherNavHover}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeCategory === 'overview'
                  ? 'bg-white text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
              }`}
            >
              Overview
            </button>

            {/* Active Category [1] with direct tab connection to Mega-Menu */}
            <button
              onClick={() => {
                setActiveCategory('departments');
                setMegaMenuOpen(!megaMenuOpen);
              }}
              onMouseEnter={handleTriggerEnter}
              onMouseLeave={handleTriggerLeave}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
                activeCategory === 'departments'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
              }`}
              title="Hover or click to toggle navigation menu"
            >
              <span>Departments</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => {
                setActiveCategory('requests');
                setSelectedRequestType(requestTypes[2]);
                setRequestFormSubmitted(false);
              }}
              onMouseEnter={handleOtherNavHover}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeCategory === 'requests'
                  ? 'bg-white text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
              }`}
            >
              Work Requests
            </button>

            <button
              onClick={() => {
                setActiveCategory('appointments');
                setSelectedRequestType(requestTypes[0]);
                setRequestFormSubmitted(false);
              }}
              onMouseEnter={handleOtherNavHover}
              className={`px-4 py-1.5 rounded-full transition-all cursor-pointer ${
                activeCategory === 'appointments'
                  ? 'bg-white text-gray-950 font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-950 hover:bg-white/50'
              }`}
            >
              Appointments
            </button>

            <button
              onClick={() => setShowAboutModal(true)}
              onMouseEnter={handleOtherNavHover}
              className="px-4 py-1.5 rounded-full text-gray-600 hover:text-gray-950 hover:bg-white/50 transition-all cursor-pointer"
            >
              About
            </button>

            <button
              onClick={() => setShowContactModal(true)}
              onMouseEnter={handleOtherNavHover}
              className="px-4 py-1.5 rounded-full text-gray-600 hover:text-gray-950 hover:bg-white/50 transition-all cursor-pointer"
            >
              Contact
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onLogin}
              className="hidden sm:inline-flex px-5 py-2 rounded-full border border-gray-300 text-gray-800 font-semibold text-xs sm:text-sm hover:border-[#5a36e6] hover:text-[#5a36e6] bg-white transition-all cursor-pointer shadow-2xs"
            >
              Login
            </button>

            {/* Work Request Button & Chip-Style Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setWorkRequestDropdownOpen(!workRequestDropdownOpen)}
                className="px-3.5 sm:px-5 py-2 rounded-full bg-[#5a36e6] hover:bg-[#4b28c7] text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Work Request Options"
              >
                <span>Work Request</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${workRequestDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Chip-Style Dropdown Menu (Responsive Width) */}
              {workRequestDropdownOpen && (
                <div
                  className="absolute right-0 mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white/98 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setWorkRequestDropdownOpen(false)}
                >
                  <div className="flex items-center justify-between px-2 pt-1 pb-2.5 mb-1.5 border-b border-gray-100">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 tracking-tight">Work Request Options</h4>
                      <p className="text-[11px] text-gray-500">Submit requests directly without login</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWorkRequestDropdownOpen(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {requestTypes.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedRequestType(item);
                            setWorkRequestDropdownOpen(false);
                            setRequestFormSubmitted(false);
                          }}
                          className="p-3 rounded-2xl border border-gray-200/90 hover:border-[#00a884] hover:bg-emerald-50/40 bg-white transition-all cursor-pointer flex items-center gap-3.5 group shadow-2xs text-left"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color} group-hover:scale-105 transition-transform shadow-2xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-emerald-700 leading-tight">
                              {item.title}
                            </h5>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#00a884] group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Menu Button (Visible below 1024px lg breakpoint) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-700 hover:bg-purple-50 transition-colors cursor-pointer"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Navigation Off-Canvas Drawer */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-2xl shadow-2xl border-l border-purple-100 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                  <path d="M12 28C10 20 18 10 28 8C26 18 18 28 12 28Z" fill="#22c55e" />
                  <path d="M12 28C16 28 22 22 28 8C18 10 10 20 12 28Z" fill="#15803d" />
                  <path d="M14 26C18 20 22 14 28 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">WorkHub</h3>
                <p className="text-[10px] text-gray-500">Navigation Menu</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
              title="Close Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Nav Links */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('overview');
                  setMobileMenuOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  activeCategory === 'overview'
                    ? 'bg-purple-50 text-[#5a36e6]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>Overview</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              {/* Departments Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setMobileDeptAccordion(!mobileDeptAccordion)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    mobileDeptAccordion || activeCategory === 'departments'
                      ? 'bg-purple-50 text-[#5a36e6]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Departments</span>
                    {hasLiveDepts && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileDeptAccordion ? 'rotate-180' : ''}`} />
                </button>

                {mobileDeptAccordion && (
                  <div className="mt-1.5 ml-2 pl-3 border-l-2 border-purple-100 space-y-1 py-1 animate-in fade-in duration-150">
                    {allAvailableDepts.map(dept => {
                      const Icon = getDeptIcon(dept.icon);
                      return (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => {
                            handleDeptClick(dept);
                            setMobileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:text-[#5a36e6] hover:bg-purple-50/70 text-left transition-colors cursor-pointer"
                        >
                          <Icon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">{dept.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSelectedRequestType(requestTypes[2]);
                  setRequestFormSubmitted(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>Work Requests</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSelectedRequestType(requestTypes[0]);
                  setRequestFormSubmitted(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>Appointments</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAboutModal(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>About Platform</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowContactModal(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer"
              >
                <span>Contact &amp; Support</span>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </div>

            {/* Quick Contact & WhatsApp Pill in Mobile Drawer */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>WhatsApp Dual-Receipts Monitored</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Support: 789974697
              </p>
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col gap-2.5 bg-gray-50/60">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogin();
              }}
              className="w-full py-2.5 rounded-xl border border-gray-300 hover:border-[#5a36e6] hover:text-[#5a36e6] bg-white text-gray-900 font-semibold text-xs text-center transition-all cursor-pointer shadow-2xs"
            >
              Sign In to Workspace
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setWorkRequestDropdownOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4b28c7] text-white font-semibold text-xs text-center flex items-center justify-center gap-2 shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              <span>Work Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ---------------- MEGA-MENU SUB-NAVIGATION BAR (Menu navigation in Figma Diagram) ---------------- */}
      {megaMenuOpen && (
        <section
          onMouseEnter={handleMenuEnter}
          onMouseLeave={handleMenuLeave}
          className="w-full bg-slate-950 text-white border-b border-slate-800 shadow-2xl relative z-40 animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-[#a78bfa] flex items-center justify-center border border-purple-500/30 shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase">Department &amp; Service Directory</h3>
                  <p className="text-xs text-slate-400">Institutional navigation across clinical care, diagnostic labs, requests, and governance</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMegaMenuOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                title="Close Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Multi-Column Menu Navigation Groups matching Figma wireframe */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {/* Column 1: Hospital Departments (Live Sync from Database) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-purple-400 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital Departments</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {col1Depts.map((dept) => {
                    const Icon = getDeptIcon(dept.icon);
                    return (
                      <li key={dept.id}>
                        <button
                          type="button"
                          onClick={() => handleDeptClick(dept)}
                          className="hover:text-purple-300 text-left transition flex items-center justify-between w-full group cursor-pointer py-0.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">{dept.name}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Column 2: Specialized & Diagnostic Services (Or 2nd Half of Live Departments) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>{hasLiveDepts && liveDepartments.length > 4 ? 'Allied Departments' : 'Diagnostics & Research'}</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  {col2Depts.map((dept) => {
                    const Icon = getDeptIcon(dept.icon);
                    return (
                      <li key={dept.id}>
                        <button
                          type="button"
                          onClick={() => handleDeptClick(dept)}
                          className="hover:text-emerald-300 text-left transition flex items-center justify-between w-full group cursor-pointer py-0.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{dept.name}</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition shrink-0 ml-2" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Column 3: Work Requests & Meet */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Work Requests &amp; Meet</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestType(requestTypes[0]);
                        setRequestFormSubmitted(false);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-sky-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Schedule Meeting (1:1 / Group)</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestType(requestTypes[1]);
                        setRequestFormSubmitted(false);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-sky-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Organize Institutional Event</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestType(requestTypes[2]);
                        setRequestFormSubmitted(false);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-sky-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Submit Assigned Work Request</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequestType(requestTypes[3]);
                        setRequestFormSubmitted(false);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-sky-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>General Information Inquiry</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                </ul>
              </div>

              {/* Column 4: Operations & Governance */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Operations &amp; Portal</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onLogin();
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-amber-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Sign In to Admin Portal</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setMegaMenuOpen(false);
                        if (allAvailableDepts.length > 0) {
                          handleDeptClick(allAvailableDepts[0]);
                        }
                      }}
                      className="hover:text-amber-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Department Directory Overview</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAboutModal(true);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-amber-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Platform Security &amp; Encryption</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setShowContactModal(true);
                        setMegaMenuOpen(false);
                      }}
                      className="hover:text-amber-300 text-left transition flex items-center justify-between w-full group cursor-pointer"
                    >
                      <span>Contact Hospital Support</span>
                      <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition" />
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
      </div>

      {/* ---------------- HERO SECTION (Matching Screenshot 1) ---------------- */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20 flex flex-col justify-center w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* Left Hero Details */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-center">
            {/* Liquid Frosted Glass Hero Container */}
            <div className="p-6 sm:p-9 lg:p-12 rounded-3xl bg-white/35 hover:bg-white/40 backdrop-blur-2xl backdrop-saturate-150 border border-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.1),inset_0_1px_2px_rgba(255,255,255,0.95)] max-w-2xl transition-all duration-300">
              {/* Pill Tag */}
              <span className="font-['Plus_Jakarta_Sans',sans-serif] text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] sm:tracking-[0.25em] text-[#5a36e6] bg-purple-500/10 px-3 sm:px-3.5 py-1.5 rounded-full border border-purple-400/30 backdrop-blur-md inline-flex items-center gap-1.5 sm:gap-2 mb-3.5 sm:mb-4 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#5a36e6]" />
                <span>TEAM COLLABORATION PLATFORM</span>
              </span>

              {/* Fancy Editorial Serif Headline */}
              <div className="space-y-1">
                <h2 className="font-['Playfair_Display',Georgia,serif] text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-950 tracking-tight leading-[1.08] sm:leading-[1.05] drop-shadow-xs break-words">
                  WorkHub
                </h2>
                <h2 className="font-['Playfair_Display',Georgia,serif] italic text-4xl sm:text-6xl lg:text-7xl font-semibold text-[#5a36e6] tracking-tight leading-[1.08] sm:leading-[1.05] drop-shadow-xs break-words">
                  Team Workspace
                </h2>
              </div>

              {/* Paragraph Subtitle */}
              <p className="mt-4 sm:mt-5 text-gray-800 text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed font-normal font-['Plus_Jakarta_Sans',sans-serif]">
                A unified platform to manage teams, assignments, appointments and communication — all in one workspace.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <button
                  onClick={onLogin}
                  className="px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#5a36e6] via-[#6942ed] to-[#7952f5] hover:from-[#4b2ac9] hover:to-[#633ad8] text-white font-semibold text-xs sm:text-sm shadow-[0_10px_25px_-5px_rgba(90,54,230,0.5)] flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-5px_rgba(90,54,230,0.6)] cursor-pointer"
                >
                  <span>Login to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4 Feature Badges in matching Frosted Glass (Display / Viewing Only) */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-2xl">
              {/* Feature 1: Team Management */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all select-none min-h-[100px] sm:min-h-[110px] flex flex-col justify-between"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-white/90 text-[#5a36e6] flex items-center justify-center mb-2 shadow-xs shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                  Team Management
                </h4>
              </div>

              {/* Feature 2: Work Request */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all select-none min-h-[100px] sm:min-h-[110px] flex flex-col justify-between"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-white/90 text-[#5a36e6] flex items-center justify-center mb-2 shadow-xs shrink-0">
                  <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                  Work Request
                </h4>
              </div>

              {/* Feature 3: Appointment Scheduling */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all select-none min-h-[100px] sm:min-h-[110px] flex flex-col justify-between"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-white/90 text-[#5a36e6] flex items-center justify-center mb-2 shadow-xs shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                  Appointment Scheduling
                </h4>
              </div>

              {/* Feature 4: Real-time Messaging */}
              <div
                className="p-3.5 sm:p-4 rounded-2xl bg-white/45 backdrop-blur-2xl border border-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] transition-all select-none min-h-[100px] sm:min-h-[110px] flex flex-col justify-between"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/80 border border-white/90 text-[#5a36e6] flex items-center justify-center mb-2 shadow-xs shrink-0">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-gray-900 leading-snug font-['Plus_Jakarta_Sans',sans-serif]">
                  Real-time Messaging
                </h4>
              </div>
            </div>
          </div>

          {/* Right side is open space for the natural architectural background */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 min-h-[360px] pointer-events-none" aria-hidden="true" />
        </div>
      </main>

      {/* ---------------- MULTI-COLUMN FOOTER (Footer in Figma Diagram) ---------------- */}
      <footer className="w-full bg-slate-950/95 backdrop-blur-xl text-white border-t border-slate-800/80 pt-10 sm:pt-14 pb-8 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Brand Logo & Bio */}
            <div className="sm:col-span-2 lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 flex items-center justify-center">
                  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                    <path d="M12 28C10 20 18 10 28 8C26 18 18 28 12 28Z" fill="#22c55e" />
                    <path d="M12 28C16 28 22 22 28 8C18 10 10 20 12 28Z" fill="#15803d" />
                    <path d="M14 26C18 20 22 14 28 8" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">WorkHub</h4>
                  <p className="text-[11px] text-slate-400">Team Workspace Platform</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Empowering hospital departments, clinical staff, and operations with synchronized assignments, real-time messaging, and automated WhatsApp delivery.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>256-Bit SSL Encrypted • BGS MCH Portal</span>
              </div>
            </div>

            {/* Column 1: Platform */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Platform</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition cursor-pointer">
                    Overview
                  </button>
                </li>
                <li>
                  <button onClick={onLogin} className="hover:text-white transition cursor-pointer">
                    Sign In to Workspace
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedRequestType(requestTypes[2]); setRequestFormSubmitted(false); }} className="hover:text-white transition cursor-pointer">
                    Work Requests
                  </button>
                </li>
                <li>
                  <button onClick={() => { setSelectedRequestType(requestTypes[0]); setRequestFormSubmitted(false); }} className="hover:text-white transition cursor-pointer">
                    Book Appointment
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Departments */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Departments</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                {allAvailableDepts.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    <button onClick={() => handleDeptClick(d)} className="hover:text-white transition cursor-pointer text-left truncate max-w-full">
                      {d.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Contact & Info */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300">Support &amp; Contact</h5>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <a href="mailto:bgsmchhospitalnagarur@gmail.com" className="hover:text-white transition-colors truncate">
                    bgsmchhospitalnagarur@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <a href="tel:789974697" className="hover:text-white transition-colors">
                    789974697
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Digital Health and Ai Center</span>
                </li>
                <li className="pt-1">
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>WhatsApp Service Monitored</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3 text-center sm:text-left">
            <p>© 2026 WorkHub • BGS Digital Health. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowAboutModal(true)} className="hover:text-slate-300 transition cursor-pointer">About Platform</button>
              <span>•</span>
              <button onClick={() => setShowContactModal(true)} className="hover:text-slate-300 transition cursor-pointer">Contact &amp; Emergency</button>
            </div>
          </div>
        </div>
      </footer>


      {/* ---------------- MODAL 1: Department Info Modal ---------------- */}
      {selectedDeptInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl p-5 sm:p-6 relative">
            <button
              onClick={() => setSelectedDeptInfo(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-4">
              <selectedDeptInfo.icon className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">{selectedDeptInfo.title}</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{selectedDeptInfo.desc}</p>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedDeptInfo(null);
                  onLogin();
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#5a36e6] hover:bg-[#4d2ec4] text-white font-semibold text-xs shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Department Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 3: About Modal ---------------- */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl p-5 sm:p-8 relative">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#5a36e6] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-gray-900">About WorkHub</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              WorkHub is an institutional enterprise workspace platform built specifically for healthcare departments, hospital management, academic institutes, and operational teams.
            </p>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              It consolidates team assignments, task verification, daily progress timelines, appointment scheduling, and encrypted real-time communications into a single interface.
            </p>

            <button
              onClick={() => setShowAboutModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 4: Contact Modal ---------------- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl p-5 sm:p-8 relative">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 mb-4">Contact &amp; Support</h3>
            <div className="space-y-3 text-xs text-gray-600">
              <a href="mailto:bgsmchhospitalnagarur@gmail.com" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100 hover:bg-purple-100/60 transition-colors">
                <Mail className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span className="font-medium text-gray-800">bgsmchhospitalnagarur@gmail.com</span>
              </a>
              <a href="tel:789974697" className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100 hover:bg-purple-100/60 transition-colors">
                <Phone className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span className="font-medium text-gray-800">789974697</span>
              </a>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/60 border border-purple-100">
                <MapPin className="w-4 h-4 text-[#5a36e6] shrink-0" />
                <span className="font-medium text-gray-800">Digital Health and Ai Center</span>
              </div>
            </div>

            <button
              onClick={() => setShowContactModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------- MODAL 5: Work Request Submission Modal (Chip Selection & Direct Form) ---------------- */}
      {selectedRequestType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
          {selectedRequestType.id === 'meeting' ? (
            /* ============================================================== */
            /* DEDICATED PROFESSIONAL "MEETING" FORM (Playfair / Inter)       */
            /* Soft Ivory-to-Sage Background with Architectural Linework       */
            /* ============================================================== */
            <div className="w-full max-w-xl my-auto rounded-3xl overflow-hidden relative shadow-2xl border border-[#c4d4c0] bg-gradient-to-b from-[#f4f7f1] via-[#edf3ea] to-[#e4ede0] p-4 sm:p-8 animate-in zoom-in-95 duration-200 transition-all max-h-[90vh] overflow-y-auto">

              {/* Classical Architectural Neoclassical Column Linework (Left & Right) */}
              <svg className="hidden md:block absolute left-2 top-3 bottom-3 w-8 text-[#98af93]/40 pointer-events-none select-none h-[calc(100%-24px)]" viewBox="0 0 32 600" fill="none" preserveAspectRatio="none">
                <rect x="2" y="4" width="28" height="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M4 8 C6 14 8 18 8 22 H24 C24 18 26 14 28 8" stroke="currentColor" strokeWidth="1" fill="none" />
                <line x1="2" y1="22" x2="30" y2="22" stroke="currentColor" strokeWidth="1" />
                <line x1="6" y1="22" x2="6" y2="570" stroke="currentColor" strokeWidth="0.8" />
                <line x1="12" y1="22" x2="12" y2="570" stroke="currentColor" strokeWidth="1" />
                <line x1="20" y1="22" x2="20" y2="570" stroke="currentColor" strokeWidth="1" />
                <line x1="26" y1="22" x2="26" y2="570" stroke="currentColor" strokeWidth="0.8" />
                <line x1="2" y1="570" x2="30" y2="570" stroke="currentColor" strokeWidth="1" />
                <rect x="4" y="570" width="24" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="2" y="576" width="28" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>

              <svg className="hidden md:block absolute right-2 top-3 bottom-3 w-8 text-[#98af93]/40 pointer-events-none select-none h-[calc(100%-24px)]" viewBox="0 0 32 600" fill="none" preserveAspectRatio="none">
                <rect x="2" y="4" width="28" height="4" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <path d="M4 8 C6 14 8 18 8 22 H24 C24 18 26 14 28 8" stroke="currentColor" strokeWidth="1" fill="none" />
                <line x1="2" y1="22" x2="30" y2="22" stroke="currentColor" strokeWidth="1" />
                <line x1="6" y1="22" x2="6" y2="570" stroke="currentColor" strokeWidth="0.8" />
                <line x1="12" y1="22" x2="12" y2="570" stroke="currentColor" strokeWidth="1" />
                <line x1="20" y1="22" x2="20" y2="570" stroke="currentColor" strokeWidth="1" />
                <line x1="26" y1="22" x2="26" y2="570" stroke="currentColor" strokeWidth="0.8" />
                <line x1="2" y1="570" x2="30" y2="570" stroke="currentColor" strokeWidth="1" />
                <rect x="4" y="570" width="24" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
                <rect x="2" y="576" width="28" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>

              {/* Architectural Top Arch Line */}
              <div className="hidden md:block absolute top-3 left-10 right-10 h-3 border-t border-b border-[#98af93]/30 pointer-events-none" />

              {/* Close Button */}
              <div className="flex justify-end mb-2 relative z-10">
                <button
                  type="button"
                  onClick={resetRequestForm}
                  className="p-1.5 rounded-full text-[#133926]/60 hover:text-[#133926] hover:bg-black/5 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {requestFormSubmitted ? (
                /* Success Confirmation View */
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#d2ded0] text-center space-y-4 my-2 relative z-10 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#eaf3e8] text-[#133926] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#133926]">
                      Meeting Request Scheduled
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-inter">
                      Your meeting request has been recorded and submitted to the Administration Office.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f7f9f6] border border-[#d2ded0] max-w-sm mx-auto text-left text-xs font-inter space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference Code:</span>
                      <span className="font-mono font-bold text-[#133926]">{referenceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Mode:</span>
                      <span className="font-semibold text-gray-800">{meetingMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-semibold text-gray-800">{meetingType === 'one-to-many' ? 'Group Meeting' : '1-on-1 Meeting'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold text-gray-800">{meetingTime || 'As scheduled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sender:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{meetingSenderName}</span>
                    </div>
                    {meetingSenderNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sender Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">{meetingSenderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receiver:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">
                        {meetingReceiverName || (selectedGroupReceivers.length > 0 ? `${selectedGroupReceivers[0].name}${selectedGroupReceivers.length > 1 ? ` (+${selectedGroupReceivers.length - 1} more)` : ''}` : meetingReceiverEmail)}
                      </span>
                    </div>
                    {(meetingReceiverNumber || (selectedGroupReceivers.length > 0 && selectedGroupReceivers[0]?.phone)) && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receiver Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">
                          {meetingReceiverNumber || selectedGroupReceivers[0]?.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* If Online Join URL was generated by backend */}
                  {createdJoinUrl && (
                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2 max-w-sm mx-auto">
                      <a
                        href={createdJoinUrl}
                        className="w-full py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-inter text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
                      >
                        <Video className="w-4 h-4" /> Join Video Call Now
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          const fullUrl = window.location.origin + createdJoinUrl;
                          navigator.clipboard.writeText(fullUrl);
                          alert('Meeting join link copied to clipboard: ' + fullUrl);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#9cb298] text-[#133926] hover:bg-black/5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={resetRequestForm}
                    className="px-6 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-inter text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* ============================================================ */
                /* WEBSITE LIVE INTERACTIVE FORM (Single responsive form)      */
                /* ============================================================ */
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#d2ded0] relative z-10">
                  <form onSubmit={handleMeetingSubmit} className="space-y-5">
                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#133926] tracking-tight mb-2">
                      Meeting
                    </h2>

                    {/* Section 1: Sender Details */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#133926] whitespace-nowrap">
                          Sender Details
                        </span>
                        {currentUser && (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-[#e8f1e6] text-[#133926] font-medium border border-[#c5d8c3]">
                            Signed-in Account
                          </span>
                        )}
                        <div className="h-px bg-[#c6d4c2] flex-1" />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Sender Name
                          </label>
                          <input
                            type="text"
                            required
                            value={meetingSenderName}
                            onChange={(e) => setMeetingSenderName(e.target.value)}
                            placeholder="Enter sender name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Sender Email ID
                          </label>
                          <input
                            type="email"
                            required
                            value={meetingSenderEmail}
                            onChange={(e) => setMeetingSenderEmail(e.target.value)}
                            placeholder="Enter sender email"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Sender Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={meetingSenderNumber}
                            onChange={(e) => setMeetingSenderNumber(e.target.value)}
                            placeholder="Enter 10-digit sender number"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Receiver Details (Direct Typing) */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#133926] whitespace-nowrap">
                          Receiver Details
                        </span>
                        <div className="h-px bg-[#c6d4c2] flex-1" />
                      </div>

                      {/* Group Participant Chips (for Group 1-to-Many meetings) */}
                      {meetingType === 'one-to-many' && selectedGroupReceivers.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-gray-600">Added Group Participants ({selectedGroupReceivers.length}):</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedGroupReceivers.map(r => (
                              <span key={r.email} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#e8f1e6] border border-[#c0d6bd] text-xs text-[#133926]">
                                <span>{r.name} ({r.email})</span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedGroupReceivers(prev => prev.filter(x => x.email !== r.email))}
                                  className="text-gray-400 hover:text-red-600 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Typed Input Fields for Receiver Name, Receiver Email ID and Receiver Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Receiver Name
                          </label>
                          <input
                            type="text"
                            required={selectedGroupReceivers.length === 0}
                            value={meetingReceiverName}
                            onChange={(e) => setMeetingReceiverName(e.target.value)}
                            placeholder="Enter receiver name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Receiver Email ID
                          </label>
                          <input
                            type="email"
                            required={selectedGroupReceivers.length === 0}
                            value={meetingReceiverEmail}
                            onChange={(e) => setMeetingReceiverEmail(e.target.value)}
                            placeholder="Enter receiver email"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Receiver Number
                          </label>
                          <input
                            type="tel"
                            required={selectedGroupReceivers.length === 0}
                            value={meetingReceiverNumber}
                            onChange={(e) => setMeetingReceiverNumber(e.target.value)}
                            placeholder="Enter 10-digit receiver number"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                      </div>

                      {/* If Group (1-to-Many) mode, allow clicking "+ Add Participant to Group" to add multiple typed participants */}
                      {meetingType === 'one-to-many' && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                              if (!meetingReceiverName.trim() || !meetingReceiverEmail.trim()) {
                                alert('Please enter both Receiver Name and Email ID to add to group.');
                                return;
                              }
                              if (!emailRegex.test(meetingReceiverEmail.trim())) {
                                alert('Please enter a valid Receiver Email ID.');
                                return;
                              }
                              if (selectedGroupReceivers.some(r => r.email.toLowerCase() === meetingReceiverEmail.trim().toLowerCase())) {
                                alert('This participant is already added to the group list.');
                                return;
                              }
                              setSelectedGroupReceivers(prev => [
                                ...prev,
                                {
                                  name: meetingReceiverName.trim(),
                                  email: meetingReceiverEmail.trim(),
                                  phone: meetingReceiverNumber.trim()
                                }
                              ]);
                              setMeetingReceiverName('');
                              setMeetingReceiverEmail('');
                              setMeetingReceiverNumber('');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#e3ede0] hover:bg-[#d5e3d1] text-[#133926] border border-[#b8ceb5] text-xs font-semibold font-inter transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <span>+ Add Participant to Group</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Section 3: Mode of Meeting */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#133926] whitespace-nowrap">
                          Mode of Meeting
                        </span>
                        <div className="h-px bg-[#c6d4c2] flex-1" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Mode of Meeting
                          </label>
                          <div className="relative">
                            <select
                              value={meetingMode}
                              onChange={(e) => setMeetingMode(e.target.value as 'Online' | 'Offline')}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter appearance-none cursor-pointer pr-10"
                            >
                              <option value="Online">Online</option>
                              <option value="Offline">Offline</option>
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        {meetingMode === 'Online' && (
                          <div>
                            <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                              Meeting Format
                            </label>
                            <div className="flex items-center gap-2 pt-0.5">
                              <button
                                type="button"
                                onClick={() => setMeetingType('one-to-one')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                  meetingType === 'one-to-one'
                                    ? 'bg-[#133926] text-white border-[#133926]'
                                    : 'bg-white text-gray-700 border-[#c4d4c0] hover:bg-[#f2f7f0]'
                                }`}
                              >
                                One-to-One
                              </button>
                              <button
                                type="button"
                                onClick={() => setMeetingType('one-to-many')}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                                  meetingType === 'one-to-many'
                                    ? 'bg-[#133926] text-white border-[#133926]'
                                    : 'bg-white text-gray-700 border-[#c4d4c0] hover:bg-[#f2f7f0]'
                                }`}
                              >
                                Group (1-to-Many)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Online Mode: Backend Generated Join URL Notice */}
                      {meetingMode === 'Online' ? (
                        <div className="p-3.5 rounded-xl bg-[#f2f6f0] border border-[#c3d5bf] text-xs text-[#1a3825] flex items-center gap-2.5">
                          <Video className="w-4 h-4 text-[#133926] shrink-0" />
                          <span>
                            Private WebRTC video meeting join URL will be <strong>generated automatically on your domain (/meet/&lt;meeting-id&gt;)</strong> upon submission.
                          </span>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Place of Meeting
                          </label>
                          <input
                            type="text"
                            value={meetingPlace}
                            onChange={(e) => setMeetingPlace(e.target.value)}
                            placeholder="Enter meeting location"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                      )}

                      {/* Date & Time Picker */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Meeting Date
                          </label>
                          <input
                            type="date"
                            value={reqDate}
                            onChange={(e) => setReqDate(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                            Time
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={meetingTime}
                              onChange={(e) => setMeetingTime(e.target.value)}
                              placeholder="e.g. 10:00 AM"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter pr-10"
                            />
                            <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Purpose / Description (Preserved across mode switches) */}
                      <div>
                        <label className="block text-xs font-semibold text-[#1a2e22] mb-1.5 font-inter">
                          Purpose / Description
                        </label>
                        <textarea
                          rows={4}
                          value={meetingPurpose}
                          onChange={(e) => setMeetingPurpose(e.target.value)}
                          placeholder="Enter meeting purpose or description"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter resize-none"
                        />
                      </div>
                    </div>

                    {/* Bottom Buttons: Solid Forest Green Submit & Outlined Cancel */}
                    <div className="flex items-center gap-3 pt-3">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-medium text-xs sm:text-sm font-inter transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? 'Scheduling Meeting...' : 'Submit'}
                      </button>
                      <button
                        type="button"
                        onClick={resetRequestForm}
                        className="px-6 py-2.5 rounded-xl border border-[#9cb298] text-[#133926] hover:bg-black/5 font-medium text-xs sm:text-sm font-inter transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : selectedRequestType.id === 'event' ? (
            /* ============================================================== */
            /* DEDICATED PROFESSIONAL "EVENT ORGANIZE" FORM (Playfair / Inter) */
            /* Soft Ivory-to-Sage Background with Architectural Linework       */
            /* ============================================================== */
            <div className="w-full max-w-xl my-auto rounded-3xl overflow-hidden relative shadow-2xl border border-[#c4d4c0] bg-gradient-to-b from-[#f4f7f1] via-[#edf3ea] to-[#e4ede0] p-4 sm:p-8 animate-in zoom-in-95 duration-200 transition-all max-h-[90vh] overflow-y-auto">
              
              {/* Classical Architectural Neoclassical Colonnade & Archway SVGs (Left & Right) */}
              {/* Left Architectural Background Illustration (Arches & Campus Tower) */}
              <svg 
                className="hidden md:block absolute -left-2 top-0 bottom-0 w-32 text-[#8ea88a]/35 pointer-events-none select-none h-full" 
                viewBox="0 0 140 700" 
                fill="none" 
                preserveAspectRatio="none"
              >
                {/* Archway & Pillar */}
                <path d="M 0 0 L 70 0 C 70 90, 110 140, 110 220 L 110 700 L 0 700 Z" fill="currentColor" fillOpacity="0.08" />
                <path d="M 70 0 C 70 90, 110 140, 110 220 L 110 700" stroke="currentColor" strokeWidth="1.5" />
                {/* Capital & Column detail */}
                <rect x="96" y="215" width="28" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <line x1="102" y1="221" x2="102" y2="690" stroke="currentColor" strokeWidth="1" />
                <line x1="110" y1="221" x2="110" y2="690" stroke="currentColor" strokeWidth="1" />
                <line x1="118" y1="221" x2="118" y2="690" stroke="currentColor" strokeWidth="1" />
                {/* Background Tower / Campus Building Silhouette */}
                <path d="M 15 320 L 15 250 L 25 230 L 35 250 L 35 320 Z" stroke="currentColor" strokeWidth="1" fill="none" />
                <line x1="25" y1="215" x2="25" y2="230" stroke="currentColor" strokeWidth="1" />
                <circle cx="25" cy="270" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
                {/* Lower Arches */}
                <path d="M 5 360 C 5 340, 35 340, 35 360 L 35 410 L 5 410 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <path d="M 40 360 C 40 340, 70 340, 70 360 L 70 410 L 40 410 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>

              {/* Right Architectural Background Illustration (Vaulted Arches & Colonnade) */}
              <svg 
                className="hidden md:block absolute -right-2 top-0 bottom-0 w-32 text-[#8ea88a]/35 pointer-events-none select-none h-full" 
                viewBox="0 0 140 700" 
                fill="none" 
                preserveAspectRatio="none"
              >
                {/* Grand Arch Frame */}
                <path d="M 140 0 L 70 0 C 70 90, 30 140, 30 220 L 30 700 L 140 700 Z" fill="currentColor" fillOpacity="0.08" />
                <path d="M 70 0 C 70 90, 30 140, 30 220 L 30 700" stroke="currentColor" strokeWidth="1.5" />
                {/* Column details */}
                <rect x="16" y="215" width="28" height="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
                <line x1="22" y1="221" x2="22" y2="690" stroke="currentColor" strokeWidth="1" />
                <line x1="30" y1="221" x2="30" y2="690" stroke="currentColor" strokeWidth="1" />
                <line x1="38" y1="221" x2="38" y2="690" stroke="currentColor" strokeWidth="1" />
                {/* Receding Gallery Arches */}
                <path d="M 65 370 C 65 345, 95 345, 95 370 L 95 440 L 65 440 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <path d="M 98 375 C 98 355, 125 355, 125 375 L 125 440 L 98 440 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
              </svg>

              {/* Architectural Top Arch Line */}
              <div className="hidden md:block absolute top-3 left-10 right-10 h-3 border-t border-b border-[#98af93]/30 pointer-events-none" />

              {/* Close Button */}
              <div className="flex justify-end mb-2 relative z-10">
                <button
                  type="button"
                  onClick={resetRequestForm}
                  className="p-1.5 rounded-full text-[#133926]/60 hover:text-[#133926] hover:bg-black/5 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {requestFormSubmitted ? (
                /* Success Confirmation View */
                <div className="bg-white rounded-3xl p-8 shadow-xl border border-[#d2ded0] text-center space-y-4 my-2 relative z-10 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#eaf3e8] text-[#133926] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#133926]">
                      Event Organize Submitted
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-inter">
                      Your event details and invitation have been recorded and sent to the Administration Office.
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f7f9f6] border border-[#d2ded0] max-w-sm mx-auto text-left text-xs font-inter space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference Code:</span>
                      <span className="font-mono font-bold text-[#133926]">{referenceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Title of Event:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{eventTitle}</span>
                    </div>
                    {eventDepartment && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-semibold text-gray-800">{eventDepartment}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold text-gray-800">{eventTime || 'As scheduled'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sender:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{eventSenderName}</span>
                    </div>
                    {eventSenderNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sender Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">{eventSenderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receiver:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{eventReceiverName}</span>
                    </div>
                    {eventReceiverNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receiver Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">{eventReceiverNumber}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={resetRequestForm}
                    className="px-6 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-inter text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                /* Centered White Card */
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#d2ded0] relative z-10">
                  <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#133926] tracking-tight mb-6 text-center">
                    Event Organize
                  </h2>

                  <form onSubmit={handleEventSubmit} className="space-y-5">
                    {/* 1. Sender Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#133926] shrink-0">
                          Sender Details
                        </h3>
                        <div className="h-px bg-[#c4d4c0] flex-1" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Sender Name
                          </label>
                          <input 
                            type="text" 
                            required
                            value={eventSenderName} 
                            onChange={(e) => setEventSenderName(e.target.value)} 
                            placeholder="Enter sender name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Sender Email ID
                          </label>
                          <input 
                            type="email" 
                            required
                            value={eventSenderEmail} 
                            onChange={(e) => setEventSenderEmail(e.target.value)} 
                            placeholder="Enter sender email ID"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Sender Number
                          </label>
                          <input 
                            type="tel" 
                            required
                            value={eventSenderNumber} 
                            onChange={(e) => setEventSenderNumber(e.target.value)} 
                            placeholder="Enter 10-digit sender number"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Receiver Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#133926] shrink-0">
                          Receiver Details
                        </h3>
                        <div className="h-px bg-[#c4d4c0] flex-1" />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Receiver Name
                          </label>
                          <input 
                            type="text" 
                            required
                            value={eventReceiverName} 
                            onChange={(e) => setEventReceiverName(e.target.value)} 
                            placeholder="Enter receiver name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Receiver Email ID
                          </label>
                          <input 
                            type="email" 
                            required
                            value={eventReceiverEmail} 
                            onChange={(e) => setEventReceiverEmail(e.target.value)} 
                            placeholder="Enter receiver email ID"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Receiver Number
                          </label>
                          <input 
                            type="tel" 
                            required
                            value={eventReceiverNumber} 
                            onChange={(e) => setEventReceiverNumber(e.target.value)} 
                            placeholder="Enter 10-digit receiver number"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Event Details */}
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-sm sm:text-base font-serif font-bold text-[#133926] shrink-0">
                          Event Details
                        </h3>
                        <div className="h-px bg-[#c4d4c0] flex-1" />
                      </div>

                      <div className="space-y-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Title of Event
                          </label>
                          <input 
                            type="text" 
                            required
                            value={eventTitle} 
                            onChange={(e) => setEventTitle(e.target.value)} 
                            placeholder="Enter event title"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Department
                          </label>
                          <input 
                            type="text" 
                            value={eventDepartment} 
                            onChange={(e) => setEventDepartment(e.target.value)} 
                            placeholder="Enter department name"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Time
                          </label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={eventTime} 
                              onChange={(e) => setEventTime(e.target.value)} 
                              placeholder="Select time"
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter pr-10"
                            />
                            <Clock className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                            Purpose / Description
                          </label>
                          <textarea 
                            rows={4}
                            value={eventPurpose} 
                            onChange={(e) => setEventPurpose(e.target.value)} 
                            placeholder="Describe the purpose of the event"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bottom Buttons: Solid Forest Green Submit & Outlined Cancel */}
                    <div className="flex items-center gap-3 pt-3">
                      <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="px-8 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-medium text-xs sm:text-sm font-inter transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                      </button>
                      <button 
                        type="button" 
                        onClick={resetRequestForm}
                        className="px-8 py-2.5 rounded-xl border border-[#133926] text-[#133926] hover:bg-black/5 font-medium text-xs sm:text-sm font-inter transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : selectedRequestType.id === 'general-info' ? (
            /* ============================================================== */
            /* DEDICATED "SUBMIT GENERAL INFORMATION" FORM                     */
            /* Matching Specification                                         */
            /* ============================================================== */
            <div className="w-full max-w-xl my-auto rounded-3xl overflow-hidden relative shadow-2xl border border-[#c4d4c0] bg-white p-5 sm:p-8 animate-in zoom-in-95 duration-200 transition-all max-h-[90vh] overflow-y-auto">
              
              {/* Header with Title and Close Icon */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#133926] tracking-tight">
                  Submit General Information
                </h2>
                <button
                  type="button"
                  onClick={resetRequestForm}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-black/5 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-800" />
                </button>
              </div>

              {requestFormSubmitted ? (
                /* Success Confirmation View */
                <div className="bg-[#fcfdfa] rounded-2xl p-6 sm:p-8 border border-[#d2ded0] text-center space-y-4 my-2 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-[#eaf3e8] text-[#133926] flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#133926]">
                      General Information Submitted
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto font-inter">
                      Your information has been recorded and submitted to the Administration Office.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border border-[#d2ded0] max-w-sm mx-auto text-left text-xs font-inter space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference Code:</span>
                      <span className="font-mono font-bold text-[#133926]">{referenceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subject:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{infoSubject}</span>
                    </div>
                    {infoDepartment && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Department:</span>
                        <span className="font-semibold text-gray-800">{infoDepartment}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Sender:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{infoSenderName} ({infoSenderEmail})</span>
                    </div>
                    {infoSenderNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sender Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">{infoSenderNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Receiver:</span>
                      <span className="font-semibold text-gray-800 truncate max-w-[170px]">{infoReceiverName} ({infoReceiverEmail})</span>
                    </div>
                    {infoReceiverNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Receiver Number:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[170px]">{infoReceiverNumber}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={resetRequestForm}
                    className="px-6 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-inter text-xs font-semibold cursor-pointer transition-all shadow-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInfoSubmit} className="space-y-4 sm:space-y-5">
                  {/* 1. Sender Details */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3.5 py-1 rounded-full bg-[#dce6d8] text-[#133926] font-semibold text-xs tracking-tight font-inter">
                        Sender Details
                      </span>
                      <div className="h-px bg-[#c4d4c0] flex-1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Sender Name
                          </label>
                          {infoErrors.senderName && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.senderName}
                            </span>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={infoSenderName} 
                          onChange={(e) => {
                            setInfoSenderName(e.target.value);
                            if (infoErrors.senderName) setInfoErrors(prev => ({ ...prev, senderName: undefined }));
                          }} 
                          placeholder="Enter sender name"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.senderName ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Sender Email ID
                          </label>
                          {infoErrors.senderEmail && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.senderEmail}
                            </span>
                          )}
                        </div>
                        <input 
                          type="email" 
                          value={infoSenderEmail} 
                          onChange={(e) => {
                            setInfoSenderEmail(e.target.value);
                            if (infoErrors.senderEmail) setInfoErrors(prev => ({ ...prev, senderEmail: undefined }));
                          }} 
                          placeholder="Enter sender email ID"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.senderEmail ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Sender Number
                          </label>
                          {infoErrors.senderNumber && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.senderNumber}
                            </span>
                          )}
                        </div>
                        <input 
                          type="tel" 
                          required
                          value={infoSenderNumber} 
                          onChange={(e) => {
                            setInfoSenderNumber(e.target.value);
                            if (infoErrors.senderNumber) setInfoErrors(prev => ({ ...prev, senderNumber: undefined }));
                          }} 
                          placeholder="Enter 10-digit sender number"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.senderNumber ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Receiver Details */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3.5 py-1 rounded-full bg-[#dce6d8] text-[#133926] font-semibold text-xs tracking-tight font-inter">
                        Receiver Details
                      </span>
                      <div className="h-px bg-[#c4d4c0] flex-1" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Receiver Name
                          </label>
                          {infoErrors.receiverName && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.receiverName}
                            </span>
                          )}
                        </div>
                        <input 
                          type="text" 
                          required
                          value={infoReceiverName} 
                          onChange={(e) => {
                            setInfoReceiverName(e.target.value);
                            if (infoErrors.receiverName) setInfoErrors(prev => ({ ...prev, receiverName: undefined }));
                          }} 
                          placeholder="Enter receiver name"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.receiverName ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Receiver Email ID
                          </label>
                          {infoErrors.receiverEmail && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.receiverEmail}
                            </span>
                          )}
                        </div>
                        <input 
                          type="email" 
                          required
                          value={infoReceiverEmail} 
                          onChange={(e) => {
                            setInfoReceiverEmail(e.target.value);
                            if (infoErrors.receiverEmail) setInfoErrors(prev => ({ ...prev, receiverEmail: undefined }));
                          }} 
                          placeholder="Enter receiver email ID"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.receiverEmail ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Receiver Number
                          </label>
                          {infoErrors.receiverNumber && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.receiverNumber}
                            </span>
                          )}
                        </div>
                        <input 
                          type="tel" 
                          required
                          value={infoReceiverNumber} 
                          onChange={(e) => {
                            setInfoReceiverNumber(e.target.value);
                            if (infoErrors.receiverNumber) setInfoErrors(prev => ({ ...prev, receiverNumber: undefined }));
                          }} 
                          placeholder="Enter 10-digit receiver number"
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.receiverNumber ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Information Details */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3.5 py-1 rounded-full bg-[#dce6d8] text-[#133926] font-semibold text-xs tracking-tight font-inter">
                        Information Details
                      </span>
                      <div className="h-px bg-[#c4d4c0] flex-1" />
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-[#1a2e22] font-inter">
                            Subject
                          </label>
                          {infoErrors.subject && (
                            <span className="text-red-500 text-[11px] font-medium font-inter">
                              {infoErrors.subject}
                            </span>
                          )}
                        </div>
                        <input 
                          type="text" 
                          value={infoSubject} 
                          onChange={(e) => {
                            setInfoSubject(e.target.value);
                            if (infoErrors.subject) setInfoErrors(prev => ({ ...prev, subject: undefined }));
                          }} 
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-white border ${infoErrors.subject ? 'border-red-400 focus:ring-red-400' : 'border-[#c4d4c0] focus:border-[#133926] focus:ring-[#133926]'} text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:ring-1 transition-all font-inter`}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                          Department
                        </label>
                        <input 
                          type="text" 
                          value={infoDepartment} 
                          onChange={(e) => setInfoDepartment(e.target.value)} 
                          placeholder="Enter department name"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#1a2e22] mb-1 font-inter">
                          Description
                        </label>
                        <textarea 
                          rows={4} 
                          value={infoDescription} 
                          onChange={(e) => setInfoDescription(e.target.value)} 
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#c4d4c0] text-xs text-[#1a2e22] placeholder:text-gray-400 focus:outline-none focus:border-[#133926] focus:ring-1 focus:ring-[#133926] transition-all font-inter resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bottom Actions: Back on left, Submit on right */}
                  <div className="flex items-center justify-between pt-3">
                    <button 
                      type="button" 
                      onClick={resetRequestForm}
                      className="text-xs sm:text-sm font-semibold text-[#133926] hover:text-[#0b2519] transition-colors cursor-pointer py-2 font-inter"
                    >
                      Back
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="px-8 py-2.5 rounded-xl bg-[#133926] hover:bg-[#0c2519] text-white font-medium text-xs sm:text-sm font-inter transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* Standard Request Modal for Event, General Information, Task / Request */
            <div className="bg-white rounded-3xl w-full max-w-lg border border-gray-100 shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 to-teal-50/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${selectedRequestType.color} shadow-xs`}>
                    <selectedRequestType.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-gray-900 leading-tight">
                        {selectedRequestType.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {selectedRequestType.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {selectedRequestType.desc}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetRequestForm}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {requestFormSubmitted ? (
                  /* Success View */
                  <div className="py-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00a884] flex items-center justify-center mx-auto shadow-sm">
                      <CheckCircle2 className="w-9 h-9" />
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        Work Request Submitted!
                      </h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                        Your request has been logged and forwarded directly to the Administrative Office.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 max-w-sm mx-auto text-left text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Reference Code:</span>
                        <span className="font-mono font-bold text-[#00a884] text-sm">{referenceId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Category:</span>
                        <span className="font-semibold text-gray-800">{selectedRequestType.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Requester:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[180px]">{reqName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 font-medium">Status:</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Under Review
                        </span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={resetRequestForm}
                        className="px-6 py-2.5 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Request Submission Form */
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    {/* Category Switcher Chips inside Modal */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Request Type (Chip Style)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {requestTypes.map((t) => {
                          const isCurrent = t.id === selectedRequestType.id;
                          const Icon = t.icon;
                          return (
                            <button
                              type="button"
                              key={t.id}
                              onClick={() => setSelectedRequestType(t)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${isCurrent
                                ? 'border-[#00a884] bg-emerald-50/60 ring-2 ring-[#00a884]/20'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isCurrent ? 'bg-[#00a884] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-bold text-xs text-gray-800 truncate">
                                {t.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Requester Name & Department */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={reqName}
                          onChange={(e) => setReqName(e.target.value)}
                          placeholder="e.g. Dr. Arvind Kumar"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Department / Organization
                        </label>
                        <select
                          value={reqDepartment}
                          onChange={(e) => setReqDepartment(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        >
                          {allAvailableDepts.map((d) => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                          <option value="Administration Office">Administration Office</option>
                          <option value="External / Visiting Faculty">External / Visiting Faculty</option>
                        </select>
                      </div>
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={reqEmail}
                          onChange={(e) => setReqEmail(e.target.value)}
                          placeholder="e.g. user@bgsdigitalhealth.org"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Phone / Contact Number
                        </label>
                        <input
                          type="tel"
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                        />
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Subject / Purpose of Request *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqSubject}
                        onChange={(e) => setReqSubject(e.target.value)}
                        placeholder={
                          selectedRequestType.id === 'event'
                            ? "e.g. Inauguration of Annual Academic Symposium"
                            : "e.g. Work proposal submission"
                        }
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                      />
                    </div>

                    {/* If Event: Preferred Date & Time */}
                    {selectedRequestType.id === 'event' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Preferred Date
                          </label>
                          <input
                            type="date"
                            value={reqDate}
                            onChange={(e) => setReqDate(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Preferred Time Slot
                          </label>
                          <select
                            value={reqTimeSlot}
                            onChange={(e) => setReqTimeSlot(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#00a884]"
                          >
                            <option value="Morning (10:00 AM - 12:00 PM)">Morning (10:00 AM - 12:00 PM)</option>
                            <option value="Afternoon (02:00 PM - 04:00 PM)">Afternoon (02:00 PM - 04:00 PM)</option>
                            <option value="Evening (04:00 PM - 06:00 PM)">Evening (04:00 PM - 06:00 PM)</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Details / Notes */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Details / Background Information
                      </label>
                      <textarea
                        rows={3}
                        value={reqDetails}
                        onChange={(e) => setReqDetails(e.target.value)}
                        placeholder="Brief details about the request or agenda..."
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884] resize-none"
                      />
                    </div>

                    {/* Priority */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-semibold text-gray-700">Urgency Level:</span>
                      <div className="flex gap-2">
                        {(['Normal', 'Urgent', 'Low'] as const).map((p) => (
                          <button
                            type="button"
                            key={p}
                            onClick={() => setReqPriority(p)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${reqPriority === p
                              ? p === 'Urgent'
                                ? 'bg-red-100 text-red-700 ring-1 ring-red-400'
                                : 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={resetRequestForm}
                        className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#008f6f] text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSubmitting ? 'Submitting...' : 'Submit Work Request'}</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

