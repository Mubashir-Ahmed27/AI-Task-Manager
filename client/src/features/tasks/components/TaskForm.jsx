import { useEffect, useState } from 'react';
import { Input, Select, Textarea } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { TASK_STATUSES, TASK_STATUS_META } from '../schemas/task.schema.js';
import { toDateInputValue } from '../../../utils/date.js';
import { toTaskPayload, validateTaskForm } from '../utils/taskUtils.js';

const EMPTY_VALUES = { title: '', description: '', status: 'pending', dueDate: '' };

/**
 * Create/edit form. Rendered inside a <Modal/> by TasksPage and the dashboard.
 * Validation runs on the client for instant feedback; the API validates again.
 */
export function TaskForm({ task = null, onSubmit, onCancel, isSubmitting = false, serverError = null }) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (task) {
      setValues({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'pending',
        dueDate: toDateInputValue(task.dueDate),
      });
    } else {
      setValues(EMPTY_VALUES);
    }
    setErrors({});
    setTouched(false);
  }, [task]);

  const updateField = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    if (touched) {
      setErrors(validateTaskForm({ ...values, [field]: event.target.value }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched(true);
    const validationErrors = validateTaskForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    await onSubmit?.(toTaskPayload(values));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Title"
        required
        value={values.title}
        onChange={updateField('title')}
        error={errors.title}
        placeholder="e.g. Draft the project proposal"
        maxLength={200}
        data-autofocus
        autoComplete="off"
      />

      <Textarea
        label="Description"
        value={values.description}
        onChange={updateField('description')}
        error={errors.description}
        placeholder="Optional details, acceptance criteria, links…"
        maxLength={4000}
        rows={4}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Status" value={values.status} onChange={updateField('status')} error={errors.status}>
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_META[status].label}
            </option>
          ))}
        </Select>

        <Input
          label="Due date"
          type="date"
          value={values.dueDate}
          onChange={updateField('dueDate')}
          error={errors.dueDate}
          hint="Optional"
        />
      </div>

      {serverError ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft/40 px-3 py-2 text-xs text-danger">
          {serverError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {task ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
