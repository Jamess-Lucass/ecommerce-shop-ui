import { useAuth } from "@/contexts/auth-context";
import { Button, Center, Flex, Modal, Text } from "@mantine/core";

type Props = {
  isOpen: boolean;
  close: () => void;
};

export default function LoginModal({ isOpen, close }: Props) {
  const { signIn } = useAuth();

  return (
    <Modal
      opened={isOpen}
      onClose={close}
      title="Please login"
      size="lg"
      centered
    >
      <Center px={18} pb={24}>
        <Flex direction="column" gap={18}>
          <Text size="md">To use this feature, you need to be logged in!</Text>

          <Button component="a" onClick={signIn}>
            Login
          </Button>
        </Flex>
      </Center>
    </Modal>
  );
}
