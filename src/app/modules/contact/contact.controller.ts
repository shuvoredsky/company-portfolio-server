import { Request, Response } from 'express';
import status from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ICreateContactPayload } from './contact.interface';
import { ContactService } from './contact.service';

const createContact = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body as ICreateContactPayload;
  const result = await ContactService.createContact(payload);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Thank you for contacting us. We will get back to you soon.',
    data: result,
  });
});

const getAllContacts = catchAsync(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  const isRead =
    req.query.isRead === 'true'
      ? true
      : req.query.isRead === 'false'
        ? false
        : undefined;
  const search =
    typeof req.query.search === 'string' ? req.query.search : undefined;

  const result = await ContactService.getAllContacts({
    page,
    limit,
    isRead,
    search,
  });

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Contact submissions retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const contact = await ContactService.getContactById(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Contact submission retrieved successfully',
    data: contact,
  });
});

const updateContactReadStatus = catchAsync(
  async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const body = req.body as { isRead?: boolean } | undefined;
    const isRead = typeof body?.isRead === 'boolean' ? body.isRead : true;

    const updated = await ContactService.updateContactReadStatus(id, isRead);

    sendResponse(res, {
      statusCode: status.OK,
      success: true,
      message: 'Contact read status updated successfully',
      data: updated,
    });
  },
);

const deleteContact = catchAsync(async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = await ContactService.deleteContact(id);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Contact submission deleted successfully',
    data: deleted,
  });
});

export const ContactController = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactReadStatus,
  deleteContact,
};

