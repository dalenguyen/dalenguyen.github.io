import { TopicButton } from '@dalenguyen/shared/ui';
import './index.module.scss';

/* eslint-disable-next-line */
export interface TopicsProps {}

export function Topics(props: TopicsProps) {
  return (
    <div className="md:container md:mx-auto p-20 bg-gray-100">
      <TopicButton topicName="Next.js" />
    </div>
  );
}

export default Topics;