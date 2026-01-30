import { EditorCanvas } from '~/components/editor';

export default function EditorTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Editor Canvas Test</h1>
      <div style={{ width: '100%', height: 'calc(100% - 60px)', border: '2px solid #ccc' }}>
        <EditorCanvas />
      </div>
    </div>
  );
}
