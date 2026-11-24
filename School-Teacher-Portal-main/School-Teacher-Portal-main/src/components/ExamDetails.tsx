import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, getStudents, getMarks, saveMarks, saveMarksCorrection, type Exam, type Student, type Mark } from '../services/mockData';
import { ArrowLeft, ClipboardList, Calendar, Users, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { useNotification } from '../contexts/NotificationContext';

export function ExamDetails() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { currentTeacher } = useAuth();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, number | ''>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { showNotification } = useNotification();

  // Correction Workflow State
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [correctionStudent, setCorrectionStudent] = useState<Student | null>(null);
  const [correctionScore, setCorrectionScore] = useState<number | ''>('');
  const [correctionReason, setCorrectionReason] = useState('');

  const loadData = () => {
    if (!examId) return;
    setLoading(true);
    Promise.all([
      getExam(examId),
      getMarks(examId)
    ]).then(([asmt, examMarks]) => {
      if (!asmt) {
        setLoading(false);
        return;
      }
      setExam(asmt);
      getStudents(asmt.classId).then(stus => {
        setStudents(stus);
        const marksMap: Record<string, number | ''> = {};
        stus.forEach(s => {
          const markRec = examMarks.find(m => m.studentId === s.id);
          marksMap[s.id] = markRec && markRec.score !== null ? markRec.score : '';
        });
        setMarks(marksMap);
        setLoading(false);
      });
    }).catch(() => {
      setError(true);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [examId]);

  const validateMarks = () => {
    if (!exam) return false;
    for (const s of students) {
      const m = marks[s.id];
      if (m !== '' && (m < 0 || m > exam.maxMarks)) {
        showNotification(`Invalid mark for ${s.name}. Must be between 0 and ${exam.maxMarks}.`, 'error');
        return false;
      }
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!exam) return;
    if (!validateMarks()) return;
    const records: Mark[] = students.map(s => ({
      studentId: s.id,
      examId: exam.id,
      score: marks[s.id] === '' ? null : Number(marks[s.id])
    }));
    await saveMarks(exam.id, records, 'Draft');
    showNotification('Draft saved successfully!', 'success');
    loadData();
  };

  const handleSubmitMarks = async () => {
    if (!exam) return;
    if (!validateMarks()) return;
    if (!window.confirm('Are you sure you want to submit? Editing will be locked.')) return;
    const records: Mark[] = students.map(s => ({
      studentId: s.id,
      examId: exam.id,
      score: marks[s.id] === '' ? null : Number(marks[s.id])
    }));
    await saveMarks(exam.id, records, 'Submitted');
    showNotification('Marks submitted successfully!', 'success');
    loadData();
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam || !correctionStudent || correctionScore === '') return;
    if (correctionScore < 0 || correctionScore > exam.maxMarks) {
      showNotification(`Invalid score. Must be between 0 and ${exam.maxMarks}.`, 'error');
      return;
    }
    
    await saveMarksCorrection({
      examId: exam.id,
      studentId: correctionStudent.id,
      originalScore: marks[correctionStudent.id] === '' ? null : Number(marks[correctionStudent.id]),
      requestedScore: Number(correctionScore),
      reason: correctionReason,
      requestedBy: currentTeacher?.name || 'Unknown'
    });
    
    showNotification('Correction request submitted and pending approval!', 'success');
    setIsCorrectionModalOpen(false);
    setCorrectionStudent(null);
    setCorrectionScore('');
    setCorrectionReason('');
  };

  const openCorrection = (student: Student) => {
    setCorrectionStudent(student);
    setCorrectionScore('');
    setCorrectionReason('');
    setIsCorrectionModalOpen(true);
  };

  if (loading) return <LoadingState message="Loading exam details..." />;
  if (error || !exam) return <ErrorState message="Could not load exam details." action={<button className="btn btn-secondary" onClick={() => navigate('/app/exams')}>Go Back</button>} />;

  const isEditable = exam.status === 'Draft';
  // Check authorization: Must be the specific subject teacher to enter marks
  const isAuthorized = currentTeacher?.subjects.includes(exam.subject);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <button className="btn btn-secondary" onClick={() => navigate('/app/exams')} style={{ alignSelf: 'flex-start', border: 'none', padding: 0 }}>
        <ArrowLeft size={20} /> Back to Exams
      </button>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{exam.title}</h1>
          <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '1rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><ClipboardList size={16} /> {exam.subject} (Class {exam.classId})</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Calendar size={16} /> {new Date(exam.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span className={`badge ${exam.status === 'Published' ? 'badge-success' : exam.status === 'Submitted' ? 'badge-warning' : ''}`} style={exam.status === 'Draft' ? { background: 'var(--border-color)', color: 'var(--text-secondary)'} : {}}>
            {exam.status}
          </span>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={24} /> Marks Entry Roster
          </h2>
          {isEditable && isAuthorized && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={handleSaveDraft}>Save Draft</button>
              <button className="btn btn-primary" onClick={handleSubmitMarks}>Submit Marks</button>
            </div>
          )}
        </div>
        
        <div className="table-responsive" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Student Name</th>
                <th style={{ padding: '1rem' }}>Marks</th>
                <th style={{ padding: '1rem' }}>Maximum</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => {
                const mark = marks[s.id];
                const isValid = mark === '' || (mark >= 0 && mark <= exam.maxMarks);
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>{s.name} ({s.rollNumber})</td>
                    <td style={{ padding: '1rem' }}>
                      {isEditable && isAuthorized ? (
                        <input 
                          type="number" 
                          className={`input-field ${!isValid ? 'input-error' : ''}`}
                          style={{ width: '100px', borderColor: !isValid ? 'var(--danger)' : undefined }}
                          value={mark}
                          onChange={e => setMarks(prev => ({ ...prev, [s.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                        />
                      ) : (
                        <span style={{ fontWeight: 'bold' }}>{mark === '' ? '-' : mark}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{exam.maxMarks}</td>
                    <td style={{ padding: '1rem' }}>
                      {!isEditable ? (
                        <span style={{ color: 'var(--text-secondary)' }}>Locked</span>
                      ) : isValid ? (
                        <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><CheckCircle size={14} /> Valid</span>
                      ) : (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><AlertCircle size={14} /> Invalid</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {(!isEditable || !isAuthorized) && exam.status !== 'Draft' && (
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.85rem' }} onClick={() => openCorrection(s)}>
                          <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Request Correction
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No students found in this class.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isCorrectionModalOpen} onClose={() => setIsCorrectionModalOpen(false)} title="Request Marks Correction">
        <form onSubmit={handleRequestCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {correctionStudent && (
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div><strong>Student:</strong> {correctionStudent.name} ({correctionStudent.rollNumber})</div>
              <div style={{ marginTop: '0.5rem' }}><strong>Original Score:</strong> {marks[correctionStudent.id] === '' ? '-' : marks[correctionStudent.id]} / {exam.maxMarks}</div>
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Requested Score</label>
            <input required type="number" min="0" max={exam?.maxMarks} className="input-field" value={correctionScore} onChange={e => setCorrectionScore(e.target.value ? Number(e.target.value) : '')} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Reason for Correction</label>
            <textarea required rows={4} className="input-field" value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} style={{ width: '100%' }} placeholder="E.g., re-evaluated answer sheet, data entry error..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>Submit Correction Request</button>
        </form>
      </Modal>
    </div>
  );
}
