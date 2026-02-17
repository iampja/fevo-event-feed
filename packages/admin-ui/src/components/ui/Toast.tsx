import toast from 'react-hot-toast';

export { toast };

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showWarning = (message: string) => {
  toast(message, {
    icon: '\u26A0',
    style: {
      background: '#FEF3C7',
      color: '#D97706',
      border: '1px solid #D97706',
    },
  });
};
