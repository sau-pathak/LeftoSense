export function createAxiosClient() {
  return {
    async get() {
      return {
        id: 'leftosense-public-settings',
        public_settings: {
          auth_required: false,
          registration_enabled: true
        }
      };
    }
  };
}
