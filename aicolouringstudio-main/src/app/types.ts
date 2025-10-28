export interface ImageResult {
  imageUrl: string;
  prompt: string;
}

export interface FormState {
  message: string | null;
  image: ImageResult | null;
  success: boolean;
  prompt: string | null;
}

export const initialFormState: FormState = {
    message: null,
    image: null,
    success: false,
    prompt: null,
};
