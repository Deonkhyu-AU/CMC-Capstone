import { supabase } from '../lib/supabase/initiliaze';

export interface Testimonial {
  id: string;
  testimonial_text: string;
  rating: number;
  created_at: string;
  is_featured: boolean;
  mentee_name: string;
  mentee_avatar_url?: string;
}

export interface TestimonialStats {
  total_reviews: number;
  average_rating: number;
  rating_1: number;
  rating_2: number;
  rating_3: number;
  rating_4: number;
  rating_5: number;
}

export interface CreateTestimonialData {
  mentor_id: number;
  mentee_id: number;
  testimonial_text: string;
  rating: number;
}

class TestimonialService {
  /**
   * Get testimonial statistics for a mentor
   */
  async getMentorStats(mentorId: number): Promise<TestimonialStats | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_mentor_testimonial_stats', { mentor_id_param: mentorId });

      if (error) throw error;
      
      return data?.[0] || {
        total_reviews: 0,
        average_rating: 0,
        rating_1: 0,
        rating_2: 0,
        rating_3: 0,
        rating_4: 0,
        rating_5: 0,
      };
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      return null;
    }
  }

  /**
   * Get testimonials for a mentor with pagination
   */
  async getMentorTestimonials(
    mentorId: number,
    limit: number = 5,
    offset: number = 0
  ): Promise<Testimonial[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_mentor_testimonials', {
          mentor_id_param: mentorId,
          limit_param: limit,
          offset_param: offset
        });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching mentor testimonials:', error);
      return [];
    }
  }

  /**
   * Check if a mentee can write a testimonial for a mentor
   */
  async canWriteTestimonial(mentorId: number, menteeId: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('can_write_testimonial', {
          mentor_id_param: mentorId,
          mentee_id_param: menteeId
        });

      if (error) throw error;
      
      return data === true;
    } catch (error) {
      console.error('Error checking testimonial eligibility:', error);
      return false;
    }
  }

  /**
   * Create a new testimonial
   */
  async createTestimonial(testimonialData: CreateTestimonialData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testimonials')
        .insert({
          mentor_id: testimonialData.mentor_id,
          mentee_id: testimonialData.mentee_id,
          testimonial_text: testimonialData.testimonial_text,
          rating: testimonialData.rating,
        });

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error creating testimonial:', error);
      throw error;
    }
  }

  /**
   * Update an existing testimonial (only if not approved)
   */
  async updateTestimonial(
    testimonialId: string,
    updates: Partial<Pick<CreateTestimonialData, 'testimonial_text' | 'rating'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update(updates)
        .eq('id', testimonialId)
        .eq('is_approved', false);

      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating testimonial:', error);
      return false;
    }
  }

  /**
   * Get current user's mentee ID
   */
  async getCurrentMenteeId(): Promise<number | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('mentees')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      return data?.id || null;
    } catch (error) {
      console.error('Error getting current mentee ID:', error);
      return null;
    }
  }

  /**
   * Check if current user is a mentee
   */
  async isCurrentUserMentee(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { data, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      return data?.user_type === 'mentee';
    } catch (error) {
      console.error('Error checking user type:', error);
      return false;
    }
  }

  /**
   * Get testimonial by mentor and mentee ID (to check if already exists)
   */
  async getExistingTestimonial(mentorId: number, menteeId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('mentor_id', mentorId)
        .eq('mentee_id', menteeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting existing testimonial:', error);
      return null;
    }
  }
}

export const testimonialService = new TestimonialService();