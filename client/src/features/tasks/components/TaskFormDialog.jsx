import { Modal } from '../../../components/ui/Modal.jsx';
import { TaskForm } from './TaskForm.jsx';

/**
 * Modal wrapper around <TaskForm/> for both create and edit flows.
 * `task === null` means "create".
 */
export function TaskFormDialog({ open, task, onClose, onSubmit, isSubmitting, serverError }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={task ? 'Edit task' : 'New task'}
      description={
        task ? 'Update the details and save your changes.' : 'Add a task to your workspace.'
      }
      footer={null}
      size="md"
    >
      <TaskForm
        task={task}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </Modal>
  );
}
