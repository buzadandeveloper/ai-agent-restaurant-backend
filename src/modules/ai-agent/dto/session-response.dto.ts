import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  object: string;

  @ApiProperty()
  model: string;

  @ApiProperty()
  expires_at: number;

  @ApiProperty()
  client_secret: {
    value: string;
    expires_at: number;
  };
}
