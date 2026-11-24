import { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

export function ReportsWorkspace() {
  const [activeTab, setActiveTab] = useState<'subject' | 'class'>('class');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Academic Reports & Analytics</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Actionable insights to answer practical questions about your classes and subjects.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'class' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('class')}
          style={{ border: activeTab === 'class' ? undefined : 'none' }}
        >
          <Users size={18} /> Class Performance
        </button>
        <button 
          className={`btn ${activeTab === 'subject' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('subject')}
          style={{ border: activeTab === 'subject' ? undefined : 'none' }}
        >
          <BarChart3 size={18} /> Subject Performance
        </button>
      </div>

      {activeTab === 'class' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Select Class:</span>
            <select className="input-field" style={{ minWidth: '200px' }}>
              <option>Grade 10 - A</option>
              <option>Grade 10 - B</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Class Average</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>82.4%</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={14} /> +2.1% from last term
              </span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Highest Assessment</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>Midterm Exam</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg: 85%</span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Lowest Assessment</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--danger)' }}>Chapter 4 Quiz</span>
              <span style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>Avg: 68% - Unusually low</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Performance Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { range: '90-100% (Excellent)', count: 8, color: 'var(--primary-color)' },
                  { range: '75-89% (Good)', count: 14, color: 'var(--success)' },
                  { range: '60-74% (Average)', count: 7, color: 'var(--warning)' },
                  { range: 'Below 60% (Needs Attention)', count: 3, color: 'var(--danger)' },
                ].map(item => (
                  <div key={item.range}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>{item.range}</span>
                      <span style={{ fontWeight: 500 }}>{item.count} students</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.count / 32) * 100}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Subject Comparison</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { name: 'Mathematics', avg: 85 },
                  { name: 'Physics', avg: 82 },
                  { name: 'Chemistry', avg: 78 },
                  { name: 'English', avg: 88 },
                  { name: 'History', avg: 71 },
                ].map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '100px', fontSize: '0.9rem' }}>{item.name}</div>
                    <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.avg}%`, height: '100%', backgroundColor: item.avg < 75 ? 'var(--warning)' : 'var(--primary-color)' }}></div>
                    </div>
                    <div style={{ width: '40px', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>{item.avg}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: '1.5rem', marginTop: '1rem' }}>Student Action Items</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--danger)' }}>
                <AlertCircle size={18} /> Requiring Attention
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Students who have fallen below 60% or missed multiple recent assignments.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'Marcus Johnson', reason: 'Failed last 2 exams' },
                  { name: 'Sarah Williams', reason: 'Missing 3 assignments' },
                  { name: 'David Lee', reason: 'Attendance dropped to 72%' },
                ].map(s => (
                  <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--danger)' }}>{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--warning)' }}>
                <TrendingDown size={18} /> Declining Performance
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Students whose average dropped by &gt;5% in the last 30 days.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'Emma Davis', reason: '88% → 81%' },
                  { name: 'James Wilson', reason: '75% → 68%' },
                ].map(s => (
                  <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--success)' }}>
                <TrendingUp size={18} /> Improving Students
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Students whose average increased by &gt;5% in the last 30 days.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[
                  { name: 'Olivia Brown', reason: '65% → 72%' },
                  { name: 'Liam Miller', reason: '82% → 89%' },
                  { name: 'Noah Moore', reason: '70% → 78%' },
                ].map(s => (
                  <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontWeight: 500 }}>{s.name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>{s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'subject' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontWeight: 500 }}>Select Subject:</span>
            <select className="input-field" style={{ minWidth: '200px' }}>
              <option>Mathematics</option>
              <option>Physics</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subject Average Score</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>79.5%</span>
              <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <TrendingUp size={14} /> Stable across 3 classes
              </span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Highest Performing Class</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>Grade 10 - A</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg: 85%</span>
            </div>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Lowest Performing Class</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>Grade 10 - C</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Avg: 72%</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Assessment Comparison</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Comparing recent assessment averages across classes for this subject. Identifies unusually low performance.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-color)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Assessment</th>
                    <th style={{ padding: '1rem' }}>Grade 10 - A</th>
                    <th style={{ padding: '1rem' }}>Grade 10 - B</th>
                    <th style={{ padding: '1rem' }}>Grade 10 - C</th>
                    <th style={{ padding: '1rem' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Chapter 3 Quiz</td>
                    <td style={{ padding: '1rem' }}>88%</td>
                    <td style={{ padding: '1rem' }}>82%</td>
                    <td style={{ padding: '1rem' }}>76%</td>
                    <td style={{ padding: '1rem', color: 'var(--success)' }}><TrendingUp size={16} /></td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }}>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Midterm Exam</td>
                    <td style={{ padding: '1rem' }}>81%</td>
                    <td style={{ padding: '1rem' }}>75%</td>
                    <td style={{ padding: '1rem', color: 'var(--danger)', fontWeight: 600 }}>64% <AlertCircle size={14} style={{ display: 'inline' }} /></td>
                    <td style={{ padding: '1rem', color: 'var(--danger)' }}><TrendingDown size={16} /></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '1rem', fontWeight: 500 }}>Chapter 4 Homework</td>
                    <td style={{ padding: '1rem' }}>92%</td>
                    <td style={{ padding: '1rem' }}>89%</td>
                    <td style={{ padding: '1rem' }}>85%</td>
                    <td style={{ padding: '1rem', color: 'var(--success)' }}><TrendingUp size={16} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Overall Score Distribution</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { range: '90-100% (Excellent)', count: 25, color: 'var(--primary-color)' },
                  { range: '75-89% (Good)', count: 42, color: 'var(--success)' },
                  { range: '60-74% (Average)', count: 18, color: 'var(--warning)' },
                  { range: 'Below 60% (Needs Attention)', count: 11, color: 'var(--danger)' },
                ].map(item => (
                  <div key={item.range}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                      <span>{item.range}</span>
                      <span style={{ fontWeight: 500 }}>{item.count} students</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(item.count / 96) * 100}%`, height: '100%', backgroundColor: item.color, borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Top / Bottom Performers</h3>
              
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Top 3 Students</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { name: 'Sophia Martinez', class: '10-A', score: '98%' },
                    { name: 'Alexander Chen', class: '10-B', score: '96%' },
                    { name: 'Isabella Taylor', class: '10-A', score: '95%' }
                  ].map(s => (
                    <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
                      <span>{s.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({s.class})</span></span>
                      <span style={{ fontWeight: 600, color: 'var(--success)' }}>{s.score}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Bottom 3 Students (Need Support)</div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    { name: 'Ethan White', class: '10-C', score: '45%' },
                    { name: 'Mia Thomas', class: '10-C', score: '51%' },
                    { name: 'Lucas Jackson', class: '10-B', score: '54%' }
                  ].map(s => (
                    <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)' }}>
                      <span>{s.name} <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({s.class})</span></span>
                      <span style={{ fontWeight: 600, color: 'var(--danger)' }}>{s.score}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
