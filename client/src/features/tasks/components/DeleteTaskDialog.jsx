import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';

/**
 * Destructive-action confirmation. Nothing is deleted until the user confirms.
 */
export function DeleteTaskDialog({ task, open, onClose, onConfirm, isDeleting = false, error = null }) {
  return (
    <Modal
      open={open}
      onClose={isDeleting ? undefined : onClose}
      title="Delete this task?"
      description="This action cannot be undone."
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
            Delete task
          </Button>
        </>
      }
    >
      <p className="text-sm text-fg-muted">
        <span className="font-medium text-fg">“{task?.title}”</span> will be permanently removed from
        the database.
      </p>
      {error ? (
        <p role="alert" className="mt-3 text-xs text-danger">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
